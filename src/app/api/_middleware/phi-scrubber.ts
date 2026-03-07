import { NextRequest, NextResponse } from 'next/server'

/**
 * PHI Co-occurrence Risk Scoring
 * 
 * Scores text and image content for potential Protected Health Information (PHI).
 * 
 * Text Scoring: Pattern matching and co-occurrence of patient identifiers
 * Image Scoring: Gemini Flash vision model analysis
 * 
 * Scoring Rules:
 * - Each match adds +1 to score (unless noted)
 * - SSN match adds +2
 * - Score determines action: 0=PASS, 1=WARN, 2=CONFIRM, 3+=BLOCK
 */

// Gemini API types
interface GeminiPhiResponse {
  phi_elements: string[]
  confidence: 'low' | 'medium' | 'high' | 'critical'
}

// PHI Detection Patterns
const PHI_PATTERNS = {
  patientName: {
    regex: /(Patient:|Pt:|Name:)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/,
    weight: 1,
    description: 'Patient name with label'
  },
  mrn: {
    regex: /(MR#|MRN|Medical Record|Acct#)\s*:?\s*\d{7,12}/i,
    weight: 1,
    description: 'Medical Record Number'
  },
  dob: {
    regex: /(DOB|Date of Birth|Born)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i,
    weight: 1,
    description: 'Date of Birth'
  },
  roomBed: {
    regex: /(Room|Bed|Unit)\s+[A-Z0-9]{1,6}/i,
    weight: 1,
    description: 'Room/Bed/Unit number'
  },
  officialHeader: {
    regex: /(Discharge Summary|Physician Orders|Admission Record|Progress Note)/i,
    weight: 1,
    description: 'Official medical document header'
  },
  dateOfService: {
    regex: /(DOS|Date of Service|Admission Date|Visit Date)\s*:?\s*\d{1,2}[\/\-]/i,
    weight: 1,
    description: 'Date of Service'
  },
  ssn: {
    regex: /\d{3}-\d{2}-\d{4}/,
    weight: 2,
    description: 'Social Security Number'
  }
}

/**
 * Score text content for PHI co-occurrence risk
 * 
 * @param text - Text content to analyze
 * @returns PHI risk score (0 = no risk, higher = more risk)
 */
export function scorePhiText(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  let score = 0
  const matches: string[] = []

  // Check each pattern
  for (const [key, pattern] of Object.entries(PHI_PATTERNS)) {
    if (pattern.regex.test(text)) {
      score += pattern.weight
      matches.push(pattern.description)
    }
  }

  return score
}

/**
 * Score image content for PHI co-occurrence risk using Gemini Flash
 * 
 * @param imageBase64 - Base64-encoded image data
 * @returns PHI risk score (0 = no risk, higher = more risk)
 */
export async function scorePhiImage(imageBase64: string): Promise<number> {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return 0
  }

  try {
    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('[PHI Scrubber] GEMINI_API_KEY not configured')
      return 0 // Fail open
    }

    // Call Gemini Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Does this image contain any of the following patient identifiers?
- Patient name
- Medical record number (MRN)
- Date of birth
- Room or bed number
- Hospital name or letterhead
- Date of service or admission date
- Social security number

Return ONLY a valid JSON object in this exact shape:
{
  "phi_elements": ["list", "of", "detected", "elements"],
  "confidence": "low" | "medium" | "high" | "critical"
}

No explanation. No markdown. JSON only.`
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          }
        })
      }
    )

    if (!response.ok) {
      console.error('[PHI Scrubber] Gemini API error:', response.status)
      return 0 // Fail open
    }

    const data = await response.json()
    
    // Extract text from Gemini response
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textContent) {
      console.error('[PHI Scrubber] No text content in Gemini response')
      return 0 // Fail open
    }

    // Parse JSON response
    let geminiResponse: GeminiPhiResponse
    try {
      // Remove markdown code blocks if present
      const cleanedText = textContent.replace(/```json\n?|\n?```/g, '').trim()
      geminiResponse = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[PHI Scrubber] Failed to parse Gemini response as JSON')
      return 0 // Fail open - invalid JSON
    }

    // Validate response structure
    if (!geminiResponse.phi_elements || !Array.isArray(geminiResponse.phi_elements)) {
      console.error('[PHI Scrubber] Invalid Gemini response structure')
      return 0 // Fail open
    }

    // Map Gemini response to numeric score
    const elementCount = geminiResponse.phi_elements.length
    const confidence = geminiResponse.confidence

    // Critical confidence always returns 4
    if (confidence === 'critical') {
      return 4
    }

    // No elements detected
    if (elementCount === 0) {
      return 0
    }

    // 1 element with low confidence
    if (elementCount === 1 && confidence === 'low') {
      return 1
    }

    // 2+ elements with medium confidence
    if (elementCount >= 2 && confidence === 'medium') {
      return 2
    }

    // 3+ elements with high confidence
    if (elementCount >= 3 && confidence === 'high') {
      return 3
    }

    // Default fallback based on element count
    if (elementCount === 1) return 1
    if (elementCount === 2) return 2
    if (elementCount >= 3) return 3

    return 0
  } catch (error) {
    // Fail open on any error
    console.error('[PHI Scrubber] Error in scorePhiImage:', error instanceof Error ? error.message : 'Unknown error')
    return 0
  }
}

/**
 * Get action and message based on PHI score
 */
function getActionForScore(score: number): {
  action: 'pass' | 'warn' | 'confirm' | 'block'
  message?: string
} {
  if (score === 0) {
    return { action: 'pass' }
  }
  
  if (score === 1) {
    return { action: 'warn' }
  }
  
  if (score === 2) {
    return {
      action: 'confirm',
      message: 'This content contains multiple patient identifiers. Are you using practice materials or a real patient record?'
    }
  }
  
  // score >= 3
  return {
    action: 'block',
    message: 'This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.'
  }
}

/**
 * PHI Scrubber Middleware
 * 
 * Wraps /api/tutor/ and /api/vision/ routes to detect and handle PHI content
 * before it reaches AI models.
 * 
 * Actions based on score:
 * - 0: PASS - Forward request normally
 * - 1: WARN - Forward request + attach header x-phi-warning: true
 * - 2: CONFIRM - Return 202 with confirmation prompt
 * - 3+: BLOCK - Return 403 with block message
 */
export async function phiScrubberMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Only process POST requests with JSON body
    if (request.method !== 'POST') {
      return handler(request)
    }

    // Clone request to read body without consuming it
    const clonedRequest = request.clone()
    
    let body: any
    try {
      body = await clonedRequest.json()
    } catch (error) {
      // If body is not JSON, pass through
      return handler(request)
    }

    // Extract text content to analyze
    let textToAnalyze = ''
    
    // Check for messages array (chat format)
    if (body.messages && Array.isArray(body.messages)) {
      // Analyze only user messages
      const userMessages = body.messages
        .filter((m: any) => m.role === 'user')
        .map((m: any) => m.content || '')
      textToAnalyze = userMessages.join('\n')
    }
    
    // Check for direct text/prompt field
    if (body.text) {
      textToAnalyze += '\n' + body.text
    }
    if (body.prompt) {
      textToAnalyze += '\n' + body.prompt
    }

    // Score the content
    const score = scorePhiText(textToAnalyze)
    const { action, message } = getActionForScore(score)

    // Handle based on action
    switch (action) {
      case 'pass':
        // Forward request normally
        return handler(request)

      case 'warn':
        // Forward request with warning header
        const warnResponse = await handler(request)
        warnResponse.headers.set('x-phi-warning', 'true')
        return warnResponse

      case 'confirm':
        // Return 202 with confirmation prompt
        return NextResponse.json(
          {
            action: 'confirm',
            message,
            score
          },
          { status: 202 }
        )

      case 'block':
        // Return 403 with block message
        return NextResponse.json(
          {
            action: 'block',
            message,
            score
          },
          { status: 403 }
        )

      default:
        return handler(request)
    }
  } catch (error) {
    // On error, fail open (allow request through) to prevent breaking the app
    console.error('[PHI Scrubber] Error in middleware:', error)
    return handler(request)
  }
}
