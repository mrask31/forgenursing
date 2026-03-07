import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { SupabaseClient } from '@supabase/supabase-js';

// Use the Message type from AI SDK
type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Manages conversation history to prevent context window bloat
 * Summarizes older messages when conversation exceeds 10 messages (5 pairs)
 */
export async function buildMessageHistory(
  messages: Message[],
  supabaseClient: SupabaseClient
): Promise<Message[]> {
  // If 10 or fewer messages (5 pairs or less), return as-is
  if (messages.length <= 10) {
    return messages;
  }

  // Split into older (to summarize) and recent (keep raw)
  const older = messages.slice(0, -10); // Everything before last 5 pairs
  const recent = messages.slice(-10); // Last 5 pairs

  try {
    // Call Claude Haiku to summarize older messages
    const { text: summary } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001') as any,
      messages: [
        {
          role: 'user',
          content: `Summarize this nursing tutoring conversation concisely. Capture: the clinical topic studied, key concepts covered, any misconceptions the student had, and where the session left off. Maximum 100 words.\n\nConversation:\n${older.map(m => `${m.role}: ${m.content}`).join('\n\n')}`,
        },
      ],
      maxTokens: 150,
    });

    // Return summary + recent messages
    return [
      {
        role: 'user',
        content: `[Session Summary]: ${summary}`,
      },
      ...recent,
    ];
  } catch (error) {
    // Fail-open: if summarization fails, return full history
    console.error('[HistoryManager] Summarization failed, returning full history:', error);
    return messages;
  }
}
