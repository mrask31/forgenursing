# Recommended First Action - Copy Update Summary

## Overview
Added "Recommended First Action" guidance to reduce decision paralysis for new users and gently guide them toward ForgeNursing's core value: understanding why answers are unsafe.

## Goals Achieved
✅ Reduced decision paralysis for first-time users
✅ Gently guided users toward most valuable first interaction
✅ Reinforced core value: understanding why answers are unsafe
✅ Non-blocking, supportive tone throughout
✅ No restrictions on user actions or removal of existing options

---

## What Changed

### 1. Post-Onboarding Success Screen (`Step3Magic.tsx`)

**Location:** After feature cards, before main CTA

**New Section Added:**
```
Recommended first step

Most nursing students struggle with understanding why an answer is unsafe. Start here.

[Go to Clinical Tutor Button]

You can explore anything — this is just a great place to begin.
```

**Visual Design:**
- Amber/orange gradient background (warm, inviting)
- Border to make it stand out but not overwhelming
- Positioned prominently but not blocking main CTA
- Small subtext reinforces it's optional

**Tone:**
- Calm and supportive
- No exclamation points
- "Recommended" not "Required"
- Subtext explicitly says "you can explore anything"

---

### 2. First Visit to Tutor - No Materials (`TutorLanding.tsx`)

**Location:** Above "Upload Materials" CTA when user has no materials

**New Guidance Card:**
```
Not sure where to start?

Try asking why one answer is unsafe. This builds clinical judgment faster than memorizing rationales.

[Why is this answer unsafe? Button]
[Help me prioritize this scenario Button]
```

**Visual Design:**
- Amber/orange gradient background (consistent with onboarding)
- Two suggested prompt buttons (clickable, non-blocking)
- Positioned above upload CTA (guidance first, work second)
- Border styling matches other contextual cards

**Tone:**
- Question format ("Not sure where to start?")
- Explains the "why" (builds clinical judgment)
- Provides two specific options
- No pressure language

---

### 3. First Visit to Tutor - Has Materials, No Chats (`TutorLanding.tsx`)

**Location:** Above "Ready to Start Studying" card when user has materials but no chat history

**New Guidance Card:**
```
Not sure where to start?

Try asking why one answer is unsafe. This builds clinical judgment faster than memorizing rationales.

[Why is this answer unsafe? Button]
[Help me prioritize this scenario Button]
```

**Visual Design:**
- Same amber/orange gradient (consistent experience)
- Same two suggested prompt buttons
- Positioned above existing "Ready to Start Studying" card
- Maintains visual hierarchy

**Tone:**
- Identical to first-time guidance (consistency)
- Supportive, not authoritative
- Explains benefit clearly

---

## Copy Details

### Headline
**"Not sure where to start?"**
- Question format (inviting, not commanding)
- Acknowledges common user feeling
- Non-judgmental

### Body Copy
**"Try asking why one answer is unsafe. This builds clinical judgment faster than memorizing rationales."**
- Suggests action with "Try" (not "You must")
- Specific prompt example
- Explains benefit (clinical judgment > memorization)
- Reinforces core differentiator

### Suggested Prompts
1. **"Why is this answer unsafe?"**
   - Direct, actionable
   - Addresses core NCLEX struggle
   - Builds safety reasoning

2. **"Help me prioritize this scenario"**
   - Alternative option
   - Addresses prioritization (another core struggle)
   - Gives user choice

### Subtext (Onboarding Only)
**"You can explore anything — this is just a great place to begin."**
- Explicitly non-restrictive
- Calm, supportive tone
- Reinforces user autonomy

---

## Design Decisions

### Color Choice: Amber/Orange
- Warm and inviting (not cold blue)
- Stands out without being alarming (not red)
- Suggests guidance, not warning
- Consistent across both placements

### Placement Strategy
**Onboarding:**
- After success messaging (user feels accomplished)
- Before main CTA (guidance first)
- Prominent but not blocking

**Tutor Landing:**
- Above existing CTAs (guidance before work)
- Dismissible by scrolling past
- Integrated with existing contextual cards

### Button Style
- White background with amber border (not solid color)
- Hover state (subtle feedback)
- Two options (gives choice, reduces pressure)
- Clickable prompts (immediate action)

---

## What Stayed the Same

✅ All routing logic
✅ All backend logic
✅ All permissions and data flow
✅ All existing user options
✅ All existing CTAs and functionality
✅ No restrictions added
✅ No features removed

---

## Tone Requirements Met

✅ **Calm and supportive** - Question format, "try" language
✅ **Non-authoritative** - "Recommended" not "Required"
✅ **Never implies must follow** - Explicit subtext about exploring anything
✅ **No exclamation points** - Removed from "Ready to Start Studying!"
✅ **No hype language** - Factual, benefit-focused copy

---

## User Flow Impact

### Before:
1. Complete onboarding → See success screen → Click "Go to Clinical Tutor"
2. Land on tutor → See empty state or generic prompts → Feel uncertain
3. Either upload materials or try random prompt

### After:
1. Complete onboarding → See success screen → See "Recommended first step" guidance
2. Click "Go to Clinical Tutor" with clear next action in mind
3. Land on tutor → See "Not sure where to start?" card with specific prompts
4. Click suggested prompt or explore freely (no pressure)

---

## Expected Benefits

### Reduces Decision Paralysis
- Clear, specific first action suggested
- Two options (not overwhelming)
- Explains why it's valuable

### Trains Mental Model
- Reinforces "why unsafe" > "memorize rationales"
- Builds clinical judgment focus
- Aligns with NCLEX reasoning

### Reinforces Differentiator
- Highlights clinical reasoning focus
- Distinguishes from generic NCLEX tools
- Builds confidence in approach

### Non-Blocking Design
- Users can ignore and explore freely
- No restrictions or forced paths
- Maintains user autonomy

---

## Files Modified

1. `src/components/onboarding/Step3Magic.tsx`
   - Added "Recommended first step" section after feature cards

2. `src/components/tutor/TutorLanding.tsx`
   - Added "Not sure where to start?" guidance card for first-time users (no materials)
   - Added "Not sure where to start?" guidance card for users with materials but no chats

---

## Testing Status

✅ All files pass TypeScript diagnostics
✅ No routing or backend changes
✅ Copy and UI text only
✅ No restrictions on user actions

---

## Why This Works

**Removes "what do I do now?" anxiety:**
- Specific, actionable suggestion
- Explains the benefit
- Gives clear next step

**Trains users into right mental model:**
- Focuses on "why unsafe" reasoning
- Builds clinical judgment habit
- Aligns with NCLEX thinking

**Reinforces differentiator:**
- Highlights clinical reasoning focus
- Distinguishes from memorization tools
- Builds confidence in approach

**Quietly coaches instead of overwhelming:**
- Calm, supportive tone
- Non-blocking design
- Maintains user autonomy

---

**Status**: ✅ Complete - Ready for review and deployment
