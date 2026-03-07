# PHI Scrubber - Usage Examples

## Example 1: Educational Content (Score 0 - PASS)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the signs and symptoms of heart failure? How do I prioritize care for a patient with chest pain?"
    }
  ]
}
```

**Score:** 0 (no PHI patterns detected)

**Action:** PASS

**Response:**
```
Request forwarded normally to AI handler
No modifications
Status: 200 OK
```

---

## Example 2: Single Identifier (Score 1 - WARN)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Patient: John Smith was admitted today with chest pain. What should I assess first?"
    }
  ]
}
```

**Score:** 1 (patient name detected)

**Action:** WARN

**Response:**
```
Request forwarded to AI handler
Header added: x-phi-warning: true
Status: 200 OK

(Frontend can show warning banner: "Reminder: Use practice materials only")
```

---

## Example 3: Multiple Identifiers (Score 2 - CONFIRM)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Patient: Jane Doe\nMRN: 12345678\nChief Complaint: Shortness of breath\n\nWhat's the priority assessment?"
    }
  ]
}
```

**Score:** 2 (patient name + MRN)

**Action:** CONFIRM

**Response:**
```json
HTTP 202 Accepted
{
  "action": "confirm",
  "message": "This content contains multiple patient identifiers. Are you using practice materials or a real patient record?",
  "score": 2
}
```

**Frontend Behavior:**
- Show confirmation dialog
- User must confirm "This is practice material" before proceeding
- If confirmed, resend request with override flag (Phase 2)

---

## Example 4: High PHI Risk (Score 4 - BLOCK)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Discharge Summary\n\nPatient: Robert Johnson\nMRN: 98765432\nDOB: 03/15/1965\n\nHospital Course: Patient admitted with acute MI..."
    }
  ]
}
```

**Score:** 4 (official header + patient name + MRN + DOB)

**Action:** BLOCK

**Response:**
```json
HTTP 403 Forbidden
{
  "action": "block",
  "message": "This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.",
  "score": 4
}
```

**Frontend Behavior:**
- Show error modal with clear message
- Do NOT send request to AI
- Preserve user's message in input (not lost)
- Suggest using practice materials instead

---

## Example 5: SSN Detection (Score 2 - CONFIRM)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Patient SSN: 123-45-6789\nWhat are the billing codes for this procedure?"
    }
  ]
}
```

**Score:** 2 (SSN has weight of +2)

**Action:** CONFIRM

**Response:**
```json
HTTP 202 Accepted
{
  "action": "confirm",
  "message": "This content contains multiple patient identifiers. Are you using practice materials or a real patient record?",
  "score": 2
}
```

---

## Example 6: Complex Medical Document (Score 6 - BLOCK)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Admission Record\n\nPt: Sarah Williams\nMedical Record: 11223344\nDate of Birth: 12/25/1980\nRoom 405B\nDOS: 01/15/2024\n\nCan you help me understand this case?"
    }
  ]
}
```

**Score:** 6
- Official header: +1
- Patient name: +1
- MRN: +1
- DOB: +1
- Room/Bed: +1
- Date of Service: +1

**Action:** BLOCK

**Response:**
```json
HTTP 403 Forbidden
{
  "action": "block",
  "message": "This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.",
  "score": 6
}
```

---

## Example 7: Case-Insensitive Detection (Score 3 - BLOCK)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "patient: john doe\nmrn: 12345678\ndob: 01/01/1990\n\nWhat's the care plan?"
    }
  ]
}
```

**Score:** 3 (lowercase patterns still detected)

**Action:** BLOCK

**Response:**
```json
HTTP 403 Forbidden
{
  "action": "block",
  "message": "This appears to contain real patient information (PHI). ForgeNursing cannot process real patient data. Please use de-identified practice materials only. Your session has not been interrupted.",
  "score": 3
}
```

---

## Example 8: Practice Case Study (Score 0 - PASS)

**Input:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Case Study: A 65-year-old male presents with chest pain radiating to the left arm. Vital signs: BP 160/95, HR 110, RR 22, SpO2 94% on RA. What's your priority assessment?"
    }
  ]
}
```

**Score:** 0 (no specific identifiers, generic case study format)

**Action:** PASS

**Response:**
```
Request forwarded normally to AI handler
Status: 200 OK
```

---

## Frontend Integration Examples (Phase 2)

### Handling WARN Response (Score 1)

```typescript
// In chat component
const response = await fetch('/api/tutor', {
  method: 'POST',
  body: JSON.stringify({ messages })
})

if (response.headers.get('x-phi-warning') === 'true') {
  // Show subtle warning banner
  showWarningBanner('Reminder: Use practice materials only')
}

// Continue processing response normally
const data = await response.json()
```

### Handling CONFIRM Response (Score 2)

```typescript
const response = await fetch('/api/tutor', {
  method: 'POST',
  body: JSON.stringify({ messages })
})

if (response.status === 202) {
  const data = await response.json()
  
  // Show confirmation dialog
  const confirmed = await showConfirmDialog({
    title: 'Patient Identifiers Detected',
    message: data.message,
    confirmText: 'This is practice material',
    cancelText: 'Cancel'
  })
  
  if (confirmed) {
    // Resend with override flag
    const retryResponse = await fetch('/api/tutor', {
      method: 'POST',
      body: JSON.stringify({ 
        messages,
        phiOverride: true // User confirmed it's practice material
      })
    })
    // Process retry response
  }
}
```

### Handling BLOCK Response (Score 3+)

```typescript
const response = await fetch('/api/tutor', {
  method: 'POST',
  body: JSON.stringify({ messages })
})

if (response.status === 403) {
  const data = await response.json()
  
  // Show error modal
  showErrorModal({
    title: 'Cannot Process Real Patient Data',
    message: data.message,
    icon: 'shield-alert',
    actions: [
      {
        label: 'Use Practice Materials',
        onClick: () => {
          // Clear input and show guidance
          showPracticeMaterialsGuide()
        }
      },
      {
        label: 'Learn More',
        onClick: () => {
          // Open help article about PHI
          openHelpArticle('phi-protection')
        }
      }
    ]
  })
  
  // Preserve user's message in input (don't lose their work)
  // They can edit and resubmit
}
```

---

## Testing Patterns

### Pattern 1: Patient Name
```
"Patient: John Smith"
"Pt: Jane Doe"
"Name: Robert Johnson"
```

### Pattern 2: MRN
```
"MRN: 12345678"
"MR# 87654321"
"Medical Record: 11223344"
"Acct#: 99887766"
```

### Pattern 3: Date of Birth
```
"DOB: 03/15/1965"
"Date of Birth: 12-25-1980"
"Born: 01/01/1990"
```

### Pattern 4: Room/Bed
```
"Room 405B"
"Bed 12A"
"Unit ICU3"
```

### Pattern 5: Official Headers
```
"Discharge Summary"
"Physician Orders"
"Admission Record"
"Progress Note"
```

### Pattern 6: Date of Service
```
"DOS: 01/15/2024"
"Date of Service: 03/20/2024"
"Admission Date: 12/01/2023"
"Visit Date: 02/14/"
```

### Pattern 7: SSN (Weight +2)
```
"123-45-6789"
"SSN: 987-65-4321"
```

---

## Edge Cases

### False Positives (Acceptable)
```
"Patient: John Smith (practice case)"  → Score 1 (WARN)
```
Better to warn on practice cases than miss real PHI.

### False Negatives (Limitations)
```
"John Smith, age 45, admitted 3/15/65"  → Score 0 (PASS)
```
Without labels, patterns don't match. This is acceptable - we focus on co-occurrence of labeled identifiers.

### Borderline Cases
```
"Room 405B has a patient with chest pain"  → Score 1 (WARN)
```
Single identifier without other context = low risk, just warn.

---

**Note**: All examples use fake/practice data. Never test with real patient information.
