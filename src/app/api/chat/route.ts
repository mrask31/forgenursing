import { RETAKE_TUTOR_PRODUCT_CONTEXT } from '@/lib/ai/retake-tutor-context';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { buildSystemPrompt, FINAL_EVIDENCE_CHECK } from '@/lib/ai/system-prompt';
import { evidenceOutputGuard } from '@/lib/ai/evidence-output-guard';
import { buildMessageHistory } from '@/lib/ai/history-manager';
import { scorePhiText } from '@/app/api/_middleware/phi-scrubber';
import { analyzeClinicalImage, type GeminiVisionResult } from '@/lib/ai/gemini-vision';
import { getEntitlementForUser } from '@/lib/entitlement';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Validate API key format at module load time (for embeddings client)
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
  console.error('[CHAT] WARNING: OPENAI_API_KEY does not start with "sk-". This may cause authentication errors.');
}

const openaiEmbeddings = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 30;

type SupabaseServerClient = ReturnType<typeof createServerClient>;

type MatchRow = {
  id?: number | string;
  content?: string;
  metadata?: any;
  similarity?: number;
  is_active?: boolean;
};

/**
 * Retrieve relevant document chunks from user's active binder documents
 * - Tries calling match_documents with filter_active (5-arg signature)
 * - If PostgREST cannot resolve overloaded RPCs (PGRST203), falls back to 4-arg call and filters active client-side.
 */
/**
 * Retrieve relevant document chunks from user's active binder documents
 * Returns context string and file status flags for better fallback messaging
 */
type BinderContextResult = {
  hasContext: boolean;
  context: string;
  contextLength: number;
  fileCount: number;
  fileSummaries?: Array<{ filename: string; document_type: string; class_id?: string }>;
};

type BinderPresenceResult = {
  hasAnyFilesForUser: boolean;
  hasAnyFilesForClass: boolean;
  activeChunkCount: number;
  fileSummaries: Array<{ filename: string; document_type: string; class_id?: string }>;
};

/**
 * Check binder presence by querying documents table directly (not RAG)
 * This mirrors the logic in /api/binder to determine if user has active files
 */
async function checkBinderPresence(
  userId: string,
  supabase: SupabaseServerClient,
  classId?: string | null
): Promise<BinderPresenceResult> {
  try {
    // Query documents table directly (same as /api/binder)
    const { data: chunkRows, error } = await supabase
      .from('documents')
      .select('id, file_key, metadata, document_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[BinderPresence] Error querying documents:', error);
      return {
        hasAnyFilesForUser: false,
        hasAnyFilesForClass: false,
        activeChunkCount: 0,
        fileSummaries: [],
      };
    }

    if (!chunkRows || chunkRows.length === 0) {
      return {
        hasAnyFilesForUser: false,
        hasAnyFilesForClass: false,
        activeChunkCount: 0,
        fileSummaries: [],
      };
    }

    // Filter by is_active (stored in metadata.is_active, defaults to true for backward compatibility)
    const activeChunks = chunkRows.filter((row: any) => {
      return row.metadata?.is_active !== false;
    });

    const activeChunkCount = activeChunks.length;
    const hasAnyFilesForUser = activeChunkCount > 0;

    // Build file summaries (group by file_key to get unique files)
    const filesByKey = new Map<string, { filename: string; document_type: string; class_id?: string }>();
    
    for (const chunk of activeChunks) {
      const key = chunk.file_key;
      if (!key) continue;
      
      const filename = chunk.metadata?.filename || chunk.metadata?.name || 'Unknown';
      const document_type = chunk.document_type || chunk.metadata?.document_type || 'unknown';
      const class_id = chunk.metadata?.class_id || chunk.metadata?.classId;
      
      // Only store once per file_key
      if (!filesByKey.has(key)) {
        filesByKey.set(key, { filename, document_type, class_id });
      }
    }

    const fileSummaries = Array.from(filesByKey.values());

    // Check if any files are linked to the specified class
    let hasAnyFilesForClass = false;
    if (classId && hasAnyFilesForUser) {
      hasAnyFilesForClass = fileSummaries.some(file => file.class_id === classId);
    }

    return {
      hasAnyFilesForUser,
      hasAnyFilesForClass,
      activeChunkCount,
      fileSummaries,
    };
  } catch (error: any) {
    console.error('[BinderPresence] Error:', error);
    return {
      hasAnyFilesForUser: false,
      hasAnyFilesForClass: false,
      activeChunkCount: 0,
      fileSummaries: [],
    };
  }
}

/**
 * Robust, fail-safe RAG retrieval helper
 * Searches all active user files regardless of class/topic scoping
 */
async function retrieveBinderContext(
  userId: string,
  ragQuery: string,
  supabase: SupabaseServerClient,
  attachedFileIds: string[] = []
): Promise<BinderContextResult> {
  try {
    // 1) Generate embedding from user's question
    const embeddingResponse = await openaiEmbeddings.embeddings.create({
      model: 'text-embedding-3-small',
      input: ragQuery,
    });

    const queryEmbedding = embeddingResponse.data?.[0]?.embedding;
    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      console.error('[RAG] Missing embedding from OpenAI response');
      return { hasContext: false, context: '', contextLength: 0, fileCount: 0 };
    }

    // 2) Search all active user files (ignore class/topic scoping for MVP)
    const match_threshold = 0.35; // Tighter threshold for quality
    const match_count = 4; // Top 4 chunks

    const { data: matchedChunks, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold,
      match_count,
      user_id_filter: userId,
      filter_active: true, // Only active files
    });

    if (rpcError) {
      console.error('[RAG] RPC error:', rpcError);
      return { hasContext: false, context: '', contextLength: 0, fileCount: 0 };
    }

    let documents: MatchRow[] = (matchedChunks as MatchRow[]) ?? [];

    // 3) Filter by attachedFileIds if provided (for specific file selection)
    if (attachedFileIds.length > 0) {
      
      documents = documents.filter((doc: any) => {
        const docId = String(doc.id || doc.document_id || '');
        const fileKey = String(doc.file_key || doc.metadata?.file_key || '');
        // Match by ID, file_key, or chunkIds
        const matchesId = attachedFileIds.some(id => String(id) === docId);
        const matchesFileKey = fileKey && attachedFileIds.some(id => String(id) === fileKey);
        const matchesChunkId = doc.metadata?.chunkIds && 
          Array.isArray(doc.metadata.chunkIds) &&
          doc.metadata.chunkIds.some((chunkId: string) => attachedFileIds.includes(String(chunkId)));
        return matchesId || matchesFileKey || matchesChunkId;
      });
      
    }

    // 4) Build context and extract file info
    const fileSummariesMap = new Map<string, { filename: string; document_type: string }>();
    let context = '';
    let contextLength = 0;

    if (documents && documents.length > 0) {
      const contextSections = documents
        .map((doc: any) => {
          const filename = doc?.metadata?.filename || doc?.metadata?.name || 'Unknown document';
          const content = doc?.content || '';
          
          // Track unique files
          if (!fileSummariesMap.has(filename)) {
            fileSummariesMap.set(filename, {
              filename,
              document_type: doc?.document_type || doc?.metadata?.document_type || 'unknown',
            });
          }
          
          contextLength += content.length;
          return `[Source: ${filename}]\n${content}`.trim();
        })
        .filter(Boolean)
        .join('\n\n');

      if (contextSections.trim()) {
        context = contextSections;
      }
    }

    const fileCount = fileSummariesMap.size;
    const fileSummaries = Array.from(fileSummariesMap.values());
    const hasContext = documents.length > 0 && context.trim().length > 0;

    return {
      hasContext,
      context,
      contextLength,
      fileCount,
      fileSummaries,
    };
  } catch (error: any) {
    console.error('[RAG] Error:', error);
    // Fail-safe: return empty but valid structure
    return { hasContext: false, context: '', contextLength: 0, fileCount: 0 };
  }
}

export async function POST(req: NextRequest) {
  // Parse body ONCE — everything uses this
  const body = await req.json();
  
  // PHI check inline — score the last user message
  const lastMessage = body.messages?.findLast(
    (m: any) => m.role === 'user'
  )?.content ?? '';
  const phiScore = scorePhiText(lastMessage);
  
  if (phiScore >= 3) {
    return NextResponse.json({
      action: 'block',
      message: 'This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.'
    }, { status: 403 });
  }
  
  // Attach phi score to headers for frontend warning/confirm
  // (frontend can read x-phi-score header and show appropriate UI)
  const phiHeaders = phiScore > 0 
    ? { 'x-phi-score': String(phiScore) } 
    : {};
  
  // Validate Anthropic API key (required for Claude)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error('[CHAT] ANTHROPIC_API_KEY is missing from environment variables');
    return new Response(JSON.stringify({ error: 'Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your environment variables.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate Anthropic API key format (basic check - should be non-empty string)
  if (anthropicKey.trim().length === 0) {
    console.error('[CHAT] ANTHROPIC_API_KEY is empty');
    return new Response(JSON.stringify({ error: 'Anthropic API key is empty. Please check your ANTHROPIC_API_KEY environment variable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate OpenAI API key before processing request (still needed for embeddings)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[CHAT] OPENAI_API_KEY is missing from environment variables');
    return new Response(JSON.stringify({ error: 'OpenAI API key is not configured. Please check your environment variables.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate API key format (should start with 'sk-')
  if (!apiKey.startsWith('sk-')) {
    const maskedKey = apiKey.length > 10 
      ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`
      : '***';
    console.error('[CHAT] Invalid API key format. API key should start with "sk-". Received:', maskedKey);
    return new Response(JSON.stringify({ error: 'Invalid OpenAI API key format. API key must start with "sk-". Please check your environment variable value (do not include the variable name in the value).' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rest of handler uses `body` directly — NOT req.json() again
  const { messages, strictMode, selectedDocIds = [], chatId, attachedFileIds: rawAttachedFileIds, imageData: rawImageData } = body;
  
  // CRITICAL: Ensure attachedFileIds is always an array, never 'none' or undefined
  const attachedFileIds = Array.isArray(rawAttachedFileIds) 
    ? rawAttachedFileIds.filter(id => id) // Filter out falsy values
    : [];
  
  // Validate and normalize imageData

  const imageData: Array<{ base64: string; mimeType: string }> = Array.isArray(rawImageData)
    ? rawImageData.filter((img: any) => img?.base64 && img?.mimeType).slice(0, 3)
    : [];

  // Log incoming request details

  // Authenticated Supabase client (cookies)
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const entitlement = await getEntitlementForUser(user.id)
  if (!entitlement.hasAccess) {
    return new Response(JSON.stringify({ error: 'Payment required', status: entitlement.status }), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get user's program_level from profile
  // Extract latest user message FIRST (before any usage)
  const userMessages = (messages || []).filter((m: any) => m.role === 'user');
  let latestUserMessage: string | null = userMessages.length > 0 && userMessages[userMessages.length - 1]?.content
    ? userMessages[userMessages.length - 1].content
    : null;

  // Get chat metadata (attachedFileIds, selected_note_ids, mode) from database if chatId provided
  let chatAttachedFileIds: string[] = []
  let chatMode: 'tutor' | 'notes' = 'tutor'
  let chatSelectedNoteIds: string[] = []
  
  if (chatId) {
    const { data: chat } = await supabase
      .from('chats')
      .select('mode, selected_note_ids, metadata')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()
    
    if (chat) {
      chatMode = (chat.mode as 'tutor' | 'notes') || 'tutor'
      chatSelectedNoteIds = (chat.selected_note_ids as string[]) || []
      // Extract attachedFileIds from metadata
      if (chat.metadata && typeof chat.metadata === 'object' && 'attachedFileIds' in chat.metadata) {
        chatAttachedFileIds = Array.isArray(chat.metadata.attachedFileIds) 
          ? chat.metadata.attachedFileIds 
          : []
      }
    }
    

  }
  
  // Ensure latestUserMessage is always a string (not null) for downstream usage
  const latestUserMessageStr = latestUserMessage || '';

  // Use chat mode if available, otherwise use filterMode from request
  const effectiveSelectedIds = chatMode === 'notes' ? chatSelectedNoteIds : selectedDocIds

  // Priority: Use attachedFileIds from chat metadata if available, otherwise use selectedDocIds from request
  const effectiveAttachedIds = chatAttachedFileIds.length > 0 ? chatAttachedFileIds : (selectedDocIds.length > 0 ? selectedDocIds : [])

  // Extract classId and topicTerm from chat metadata
  let chatClassId: string | null = null
  let chatTopicId: string | null = null
  
  if (chatId) {
    const { data: chatMeta } = await supabase
      .from('chats')
      .select('metadata')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single()
    
    if (chatMeta?.metadata && typeof chatMeta.metadata === 'object') {
      chatClassId = (chatMeta.metadata as any).classId || null
      chatTopicId = (chatMeta.metadata as any).topicId || null
    }
  }

  // Retrieve binder context via RAG
  // Priority: Use attachedFileIds from request body FIRST, then chat metadata, then selectedDocIds
  const requestAttachedIds = Array.isArray(attachedFileIds) && attachedFileIds.length > 0 ? attachedFileIds : [];
  const contextFilterIds = requestAttachedIds.length > 0 
    ? requestAttachedIds 
    : (effectiveAttachedIds.length > 0 ? effectiveAttachedIds : effectiveSelectedIds);
  
  
  // Call robust RAG helper
  let binderResult: BinderContextResult = { hasContext: false, context: '', contextLength: 0, fileCount: 0 };
  
  if (latestUserMessageStr) {
    binderResult = await retrieveBinderContext(
      user.id,
      latestUserMessageStr,
      supabase,
      contextFilterIds
    );
    
    // Debug log immediately after retrieval
  }

  const binderContext = binderResult.context;
  const fileSummaries = binderResult.fileSummaries || [];

  // Extra context sections (binder, vision, notes) — built before base prompt, re-appended after
  let systemPrompt: string = '';

  // Build messages array
  const coreMessages = messages;

  // Add binder context to system prompt if available
  if (binderResult.hasContext && binderContext && binderContext.trim().length > 0) {
    systemPrompt += `

### BINDER CONTEXT

Historical reference excerpts follow. Use them only as evidence relevant to this question; identify uncertainty or conflicts. Do not invent content beyond the excerpts or advertise a product feature based on their presence.

${binderContext}
`;
  } else {
    systemPrompt += `

### GENERAL TUTOR

Teach general NCLEX-RN retake reasoning. Do not add a materials or curriculum-status section. Do not direct the learner to removed features. Start with the question and its reasoning.
`;
  }

  // Gemini Vision: Analyze clinical images if provided
  if (imageData.length > 0) {

    const visionResults: GeminiVisionResult[] = [];

    for (const img of imageData) {
      try {
        const result = await analyzeClinicalImage(img.base64, img.mimeType);

        // Block if PHI risk is critical
        if (result.phi_risk === 'critical') {
          return NextResponse.json({
            action: 'block',
            message: 'This image appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.'
          }, { status: 403 });
        }

        visionResults.push(result);
      } catch (error: any) {
        console.error('[CHAT] Gemini Vision error:', error?.message);
        // Continue without this image — don't block the entire request
      }
    }

    if (visionResults.length > 0) {
      systemPrompt += `\n\n### CLINICAL IMAGE ANALYSIS\n\nThe student has uploaded clinical image(s). Gemini Flash analyzed them and produced the following findings. Use these findings to inform your response. Reference the image analysis when relevant.\n`;

      visionResults.forEach((result, index) => {
        systemPrompt += `\n[Image ${index + 1} — ${result.description}]\nFindings: ${result.clinicalFindings.join('; ') || 'No specific findings identified'}\nClinical observations: ${result.description}\nPHI risk: ${result.phi_risk}${result.phi_elements.length > 0 ? ` (elements: ${result.phi_elements.join(', ')})` : ''}\n`;
      });
    }
  }

  // Detect image intent without image data — guide user to retry or report
  if (imageData.length === 0 && latestUserMessageStr) {
    const imageIntentPatterns = /\b(analy[sz]e|look at|review|read|interpret|check)\b.{0,30}\b(image|photo|picture|ekg|ecg|lab|wound|x-?ray|scan|strip|result|screenshot|attachment)/i;
    const defaultImagePrompt = /please analyze this clinical image/i;
    if (imageIntentPatterns.test(latestUserMessageStr) || defaultImagePrompt.test(latestUserMessageStr)) {
      systemPrompt += `\n\n### NO IMAGE DETECTED\n\nThe student's message suggests they want to analyze a clinical image, but no image data was received in this request. Begin your ORIENT section with exactly this text (do not modify it):\n\n"I don't see an image attached. If you uploaded one, try sending it again — this sometimes happens on the first attempt in a new session. If it still isn't working, [report this issue](forge://report-image-issue) and we'll look into it."\n\nAfter this message, continue with your normal ORIENT framing of the clinical question the student asked. The link format must be exactly as shown — the client will handle it.\n`;
    }
  }

  // Save binder context + vision + notes mode sections built above
  const _extraContext = systemPrompt;

  // Build base system prompt (this replaces the placeholder)
  systemPrompt = buildSystemPrompt('ADN', 'tutor');

  // Re-append binder context, gemini vision results, and notes mode behavior
  systemPrompt += _extraContext;
  
  // Strict mode (optional)
  if (strictMode === true) {
    const { getStrictModePrompt } = await import('@/lib/ai/prompts');
    systemPrompt += '\n\n' + getStrictModePrompt();
  }

  // Presentation must not compete with the base teaching/evidence policy.
  systemPrompt += `
FORMATTING RULES:
- Use the response pattern selected by the base tutoring instructions for fictional practice scenarios.
- For non-scenario questions, provide concise, direct answers.
- A study follow-up is optional. Omit it for real-patient escalation, unverifiable citations, or a disputed/ambiguous answer key.
- If binder context was present, explicitly mention filenames and document types in your response. Example: "From Medical_Surgical_Unit_3_Heart_Failure.pdf (Textbook)…"
`;

  try {
    // Filter out any system messages from the array
    // Claude receives the system prompt via the system: parameter only
    const cleanedMessages = coreMessages.filter(
      (m: any) => m.role !== 'system'
    );
    
    
    // Convert CoreMessage[] to simple Message[] format for history manager
    // CoreMessage has complex content types (string | array), but history manager expects string
    const simpleMessages = cleanedMessages.map((m: any) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    }));
    
    
    // Build message history with summarization for long conversations
    let processedMessages;
    try {
      processedMessages = await buildMessageHistory(simpleMessages, supabase);
    } catch (historyError: any) {
      console.error('[CHAT] Error in buildMessageHistory:', historyError);
      console.error('[CHAT] History error stack:', historyError?.stack);
      // Fallback to simple messages if history manager fails
      processedMessages = simpleMessages;
    }
    
    
    // Use Claude Sonnet as the tutor brain
    let result;
    try {
      result = await streamText({
        model: anthropic('claude-sonnet-4-6') as any,
        maxTokens: 1200,
        messages: processedMessages,
        system: systemPrompt + FINAL_EVIDENCE_CHECK + RETAKE_TUTOR_PRODUCT_CONTEXT,
        experimental_transform: evidenceOutputGuard(latestUserMessageStr),
      });
    } catch (claudeError: any) {
      console.error('[CHAT] Error calling Claude:', claudeError);
      console.error('[CHAT] Claude error name:', claudeError?.name);
      console.error('[CHAT] Claude error message:', claudeError?.message);
      console.error('[CHAT] Claude error stack:', claudeError?.stack);
      console.error('[CHAT] Claude error cause:', claudeError?.cause);
      throw claudeError; // Re-throw to be caught by outer catch
    }

    const customHeaders: Record<string, string> = {};

    if (phiHeaders['x-phi-score']) {
      customHeaders['x-phi-score'] = phiHeaders['x-phi-score'];
    }

    if (fileSummaries.length > 0 && binderContext?.trim().length > 0) {
      customHeaders['X-Binder-Files'] = fileSummaries.map(f => f.filename).join(', ');
    }

    return result.toDataStreamResponse({ headers: customHeaders });
  } catch (error: any) {
    console.error('[CHAT] Error in chat route:', error);
    console.error('[CHAT] Error name:', error?.name);
    console.error('[CHAT] Error message:', error?.message);
    console.error('[CHAT] Error stack:', error?.stack);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to connect to AI';
    if (error?.message) {
      if (error.message.includes('API key') || error.message.includes('api_key')) {
        errorMessage = 'Invalid or missing Anthropic API key. Please check your environment configuration.';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Anthropic API authentication failed. Please verify your API key is correct.';
      } else if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'Anthropic API rate limit exceeded. Please try again in a moment.';
      } else if (error.message.includes('model')) {
        errorMessage = `Invalid model configuration: ${error.message}`;
      } else {
        errorMessage = `AI service error: ${error.message}`;
      }
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
