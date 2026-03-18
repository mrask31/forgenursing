import { GoogleGenerativeAI } from '@google/generative-ai';

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
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    { text: VISION_SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const responseText = result.response.text();

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
    console.error('[GeminiVision] Failed to parse response:', responseText);
    return {
      description: 'Image analysis completed but response could not be parsed',
      clinicalFindings: [],
      phi_risk: 'medium',
      phi_elements: [],
    };
  }
}
