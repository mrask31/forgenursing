import Anthropic from '@anthropic-ai/sdk';

export interface GeminiVisionResult {
  description: string;
  clinicalFindings: string[];
  phi_risk: 'low' | 'medium' | 'high' | 'critical';
  phi_elements: string[];
}

const VISION_SYSTEM_PROMPT = `You are a clinical image analyzer for nursing education. Analyze this image and return structured clinical findings. Identify any PHI elements present. Never provide diagnosis — only describe objective findings a nurse would document.

Return ONLY valid JSON in this exact format:
{
  "description": "Brief description of the image type and contents",
  "clinicalFindings": ["Finding 1", "Finding 2"],
  "phi_risk": "low|medium|high|critical",
  "phi_elements": ["element1", "element2"]
}

PHI risk levels:
- "low": No identifiable patient information visible
- "medium": Partial identifiers (e.g., dates that could be visit dates, partial names)
- "high": Clear patient identifiers visible (full names, MRNs, DOBs)
- "critical": Multiple PHI elements clearly visible (full patient records, faces with names)

For clinical images (EKGs, labs, wounds, drug calculations):
- Describe objective findings only
- Use proper medical terminology
- Note any abnormal values or patterns
- Do NOT diagnose or recommend treatment`;

export async function analyzeClinicalImage(
  imageBase64: string,
  mimeType: string
): Promise<GeminiVisionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  // Normalize mimeType for Claude's accepted image types
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
  type SupportedMediaType = typeof supportedTypes[number];
  const mediaType: SupportedMediaType = supportedTypes.includes(mimeType as SupportedMediaType)
    ? (mimeType as SupportedMediaType)
    : 'image/jpeg';

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: VISION_SYSTEM_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Extract JSON from response (handle markdown code fences)
  let jsonStr = responseText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || 'Unable to describe image',
      clinicalFindings: Array.isArray(parsed.clinicalFindings) ? parsed.clinicalFindings : [],
      phi_risk: ['low', 'medium', 'high', 'critical'].includes(parsed.phi_risk)
        ? parsed.phi_risk
        : 'low',
      phi_elements: Array.isArray(parsed.phi_elements) ? parsed.phi_elements : [],
    };
  } catch {
    console.error('[VisionAnalysis] Failed to parse response:', responseText);
    return {
      description: 'Image analysis completed but response could not be parsed',
      clinicalFindings: [],
      phi_risk: 'medium',
      phi_elements: [],
    };
  }
}
