# PHI Scrubber Middleware

## Overview

The PHI (Protected Health Information) Scrubber is a tiered confidence scoring system that acts as middleware before any content reaches AI models. It detects potential real patient data in both text and images and prevents it from being processed.

## Architecture

### File Location
- **Middleware**: `src/app/api/_middleware/phi-scrubber.ts`
- **Tests**: `__tests__/phi-scrubber.test.ts` (TypeScript) and `__tests__/phi-scrubber.test.mjs` (JavaScript)

### Exports

1. **`scorePhiText(text: string): number`**
   - Scores a string for PHI co-occurrence risk
   - Returns a numeric score (0 = no risk, higher = more risk)
   - Uses regex pattern matching

2. **`scorePhiImage(imageBase64: string): Promise<number>`**
   - Scores an image for PHI co-occurrence risk using Gemini Flash
   - Returns a numeric score (0 = no risk, higher = more risk)
   - Uses AI vision model for detection

3. **`phiScrubberMiddleware(request, handler)`**
   - Next.js middleware function
   - Wraps `/api/tutor/` and `/api/vision/` routes
   - Responds based on PHI score

## Scoring System

### PHI Detection Patterns

Each pattern match adds to the score (default +1, unless noted):

| Pattern | Regex | Weight | Description |
|---------|-------|--------|-------------|
| Patient Name | `/(Patient:\|Pt:\|Name:)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/` | +1 | Patient name with label |
| MRN | `/(MR#\|MRN\|Medical Record\|Acct#)\s*:?\s*\d{7,12}/i` | +1 | Medical Record Number |
| Date of Birth | `/(DOB\|Date of Birth\|Born)\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i` | +1 | Date of Birth |
| Room/Bed | `/(Room\|Bed\|Unit)\s+[A-Z0-9]{1,6}/i` | +1 | Room/Bed/Unit number |
| Official Header | `/(Discharge Summary\|Physician Orders\|Admission Record\|Progress Note)/i` | +1 | Medical document header |
| Date of Service | `/(DOS\|Date of Service\|Admission Date\|Visit Date)\s*:?\s*\d{1,2}[\/\-]/i` | +1 | Date of Service |
| SSN | `/\d{3}-\d{2}-\d{4}/` | **+2** | Social Security Number |

## Image PHI Detection

### Gemini Flash Vision Analysis

The `scorePhiImage()` function uses Google's Gemini Flash model to analyze images for PHI content.

**Detection Process:**
1. Image (base64) is sent to Gemini Flash API
2. AI analyzes for patient identifiers:
   - Patient name
   - Medical record number (MRN)
   - Date of birth
   - Room or bed number
   - Hospital name or letterhead
   - Date of service or admission date
   - Social security number
3. Gemini returns structured JSON response
4. Response is mapped to numeric score

**Gemini Response Format:**
```json
{
  "phi_elements": ["patient name", "MRN", "DOB"],
  "confidence": "low" | "medium" | "high" | "critical"
}
```

**Scoring Logic:**
- `phi_elements.length === 0` → Score 0
- `phi_elements.length === 1, confidence: low` → Score 1
- `phi_elements.length >= 2, confidence: medium` → Score 2
- `phi_elements.length >= 3, confidence: high` → Score 3
- `confidence === "critical"` → Score 4 (regardless of element count)

**Error Handling:**
- Invalid JSON response → Score 0 (fail open)
- API call failure → Score 0 (fail open)
- Missing API key → Score 0 (fail open)
- No PHI logged in errors

**Environment Variable:**
- `GEMINI_API_KEY` - Google Gemini API key (required for image PHI detection)

## Response Formats

| Score | Action | Response | Description |
|-------|--------|----------|-------------|
| 0 | **PASS** | Forward normally | No PHI detected |
| 1 | **WARN** | Forward + header | Single identifier (low risk) |
| 2 | **CONFIRM** | 202 status | Multiple identifiers (needs confirmation) |
| 3+ | **BLOCK** | 403 status | High PHI risk (blocked) |

## Text PHI Detection

### PHI Detection Patterns

### PASS (Score 0)
```
Request forwarded normally to handler
No modifications
```

### WARN (Score 1)
```
Request forwarded to handler
Header added: x-phi-warning: true
```

### CONFIRM (Score 2)
```json
HTTP 202 Accepted
{
  "action": "confirm",
  "message": "This content contains multiple patient identifiers. Are you using practice materials or a real patient record?",
  "score": 2
}
```

### BLOCK (Score 3+)
```json
HTTP 403 Forbidden
{
  "action": "block",
  "message": "This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.",
  "score": 4
}
```

## Usage

### Current Status
**Phase 1 - Implementation Only**
- Middleware is created but NOT wired into routes yet
- No existing routes are modified
- Frontend integration comes in subsequent tasks

### Future Integration (Phase 2+)
The middleware will wrap these routes:
- `/api/tutor/*` - Chat/tutor endpoints
- `/api/vision/*` - Image analysis endpoints

Example integration:
```typescript
// In route.ts
import { phiScrubberMiddleware } from '@/app/api/_middleware/phi-scrubber'

export async function POST(req: NextRequest) {
  return phiScrubberMiddleware(req, async (request) => {
    // Your existing handler logic
    // ...
  })
}
```

## Testing

### Run Tests

**TypeScript version:**
```bash
npx ts-node __tests__/phi-scrubber.test.ts
```

**JavaScript version (no compilation needed):**
```bash
node __tests__/phi-scrubber.test.mjs
```

### Test Cases

**Text PHI Detection:**

1. **Single fake name only** → Score 1 (WARN)
   ```
   "Patient: John Smith was admitted today"
   ```

2. **Name + MRN** → Score 2 (CONFIRM)
   ```
   Patient: Jane Doe
   MRN: 12345678
   ```

3. **Name + MRN + DOB + Header** → Score 4 (BLOCK)
   ```
   Discharge Summary
   Patient: Robert Johnson
   MRN: 98765432
   DOB: 03/15/1965
   ```

**Image PHI Detection:**

1. **No PHI elements** → Score 0 (PASS)
   - Gemini returns: `{ phi_elements: [], confidence: "low" }`

2. **3 PHI elements with high confidence** → Score 3 (BLOCK)
   - Gemini returns: `{ phi_elements: ["patient name", "MRN", "DOB"], confidence: "high" }`

3. **Critical confidence** → Score 4 (BLOCK)
   - Gemini returns: `{ phi_elements: ["patient name", "SSN"], confidence: "critical" }`

## Design Decisions

### Fail-Open Strategy
If the middleware encounters an error, it **fails open** (allows the request through) to prevent breaking the application. Errors are logged for monitoring.

### Pattern Matching Approach
- Uses regex patterns for speed and simplicity
- Case-insensitive matching for most patterns
- Focuses on co-occurrence (multiple identifiers together)
- Weighted scoring for high-risk identifiers (SSN)

### Request Body Analysis
The middleware analyzes:
- `messages` array (chat format) - only user messages
- `text` field (direct text input)
- `prompt` field (prompt input)

### Non-Destructive
- Original request is cloned for analysis
- No modification of request body
- Only adds headers or returns early responses

## Security Considerations

### What This Protects Against
✅ Accidental upload of real patient records
✅ Copy-paste of discharge summaries
✅ Screenshots of EMR systems (text extraction)
✅ Images containing PHI (medical documents, patient wristbands, charts)
✅ Multiple co-occurring identifiers

### What This Does NOT Protect Against
❌ Deliberately obfuscated PHI
❌ Paraphrased patient stories with identifiers removed
❌ Non-standard identifier formats
❌ Handwritten notes (OCR limitations)

### Privacy Notes
- No PHI is logged or stored
- Scoring happens in-memory only
- Failed requests do not expose PHI in error messages
- Gemini API calls are transient (no data retention by Google for API calls)

## Future Enhancements (Phase 2+)

1. **Frontend Integration**
   - User confirmation dialog for score 2
   - Warning banner for score 1
   - Clear error messaging for score 3+

2. **Enhanced Image Detection**
   - OCR preprocessing for handwritten notes
   - Multi-page document analysis
   - PDF image extraction

3. **Enhanced Patterns**
   - Phone numbers
   - Email addresses
   - Facility names
   - Provider names

4. **Audit Logging**
   - Track blocked requests (without storing PHI)
   - Analytics on PHI detection rates
   - False positive monitoring

## Compliance

This middleware helps ForgeNursing maintain HIPAA compliance by:
- Preventing processing of real patient data
- Providing clear user feedback
- Maintaining audit trail (future)
- Implementing defense-in-depth strategy

**Note**: This is a technical control, not a complete compliance solution. User education and terms of service are also required.
