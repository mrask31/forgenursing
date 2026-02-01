# ForgeNursing V1 - Complete Feature Summary

## Overview
ForgeNursing is an AI-powered NCLEX prep platform for nursing students. It uses students' own textbooks, syllabi, and notes to teach clinical reasoning and prioritization through an interactive tutor interface.

**Stack**: Next.js 14 (App Router), Supabase (Auth + PostgreSQL), Stripe (subscriptions), OpenAI (AI tutor), Vercel (hosting)

---

## Core Features

### 1. AI Clinical Tutor (Primary Feature)
**Location**: `/tutor`

**What it does**:
- Interactive AI tutor that teaches NCLEX-style clinical reasoning
- Uses student's uploaded materials (textbooks, syllabi, notes) as context
- Teaches step-by-step problem-solving using nursing frameworks (ABCs, Maslow, Safety)
- Provides visual "maps" (flowcharts, decision trees, priority ladders) for each concept
- Supports both general tutoring and class-specific study sessions

**Key capabilities**:
- **Context-aware**: References student's uploaded files in responses
- **Framework-driven**: Explicitly uses ABCs, Maslow, Safety/Risk frameworks
- **Visual learning**: Every response includes "THE MAP" - a visual structure (flow, decision tree, priority ladder)
- **Socratic method**: Asks check-for-understanding questions after explanations
- **Strict Mode**: Exam simulation mode that requires students to commit to answers before revealing reasoning
- **Flagging system**: Students can flag Q&A pairs for later review
- **Auto-resume**: Automatically resumes most recent session when returning

**Two modes**:
1. **Tutor Mode** (default): Study NCLEX topics, work through cases, review concepts
2. **Reflections Mode**: Private space for processing clinical experiences and stress

**Session types**:
- General tutor sessions (no specific context)
- Class-specific sessions (tied to a specific class)
- Topic-specific sessions (tied to a notebook topic)
- Exam mode sessions (practice questions)

---

### 2. My Classes & Materials (Binder)
**Location**: `/classes` (formerly `/binder`)

**What it does**:
- Organize classes and upload study materials
- Each class can have multiple files (textbooks, syllabi, case studies, notes)
- Materials are used as context by the AI tutor

**File types supported**:
- Textbooks (primary reference materials)
- Syllabi (course outlines, schedules)
- Reference materials (supplementary content)
- Case studies
- Notes

**Features**:
- Create/edit/delete classes
- Upload files to each class (PDF, DOCX, TXT)
- View all materials organized by class
- Quick access to start studying with specific materials
- Material counts and organization

**Technical details**:
- Files stored in Supabase Storage
- Vector embeddings created for semantic search
- RLS policies ensure users only see their own files

---

### 3. Clinical Dashboard (Readiness)
**Location**: `/readiness`

**What it does**:
- Central hub showing study progress and saved content
- Displays "study vitals" (metrics like streak, active days, concepts studied)
- Shows flagged Q&A pairs that need review
- Library of saved "learning moments" (clips)
- Study activity breakdown by class

**Study Vitals**:
- **Streak**: Consecutive days with study activity
- **This Week**: Active days in last 7 days
- **Concepts**: Unique topics explored
- **Saved**: Total learning moments saved

**Flagged for Review**:
- Shows all Q&A pairs flagged during tutor sessions
- Click to jump directly to that conversation
- Helps students focus on weak areas

**Learning Library**:
- All saved clips (learning moments)
- Search and filter by folder, tag, or keyword
- Click to review in context or start new session
- Delete clips when no longer needed

**Study Activity by Class**:
- Shows session count per class
- Helps identify which classes need more attention

---

### 4. Medical Dictionary
**Location**: `/dictionary`

**What it does**:
- Searchable database of medical terms and definitions
- Save terms to personal "word bank" for quick reference
- Filter by category (anatomy, pharmacology, pathophysiology, etc.)
- Filter by saved/not saved status

**Features**:
- Search by term or definition
- Category filters (Anatomy, Pharmacology, Pathophysiology, etc.)
- Save/unsave terms with one click
- Saved terms persist across sessions
- Visual indicators for saved terms

---

### 5. Notebook (Topic Management)
**Location**: Integrated into tutor (via context panel)

**What it does**:
- Create topics within classes for organized study
- Each topic can have:
  - Title and description
  - Study notes
  - Associated tutor sessions
  - Last studied timestamp
- Topics provide context to the AI tutor

**Features**:
- Create topics from tutor interface
- Save assistant responses as topic summaries
- Track when topics were last studied
- Navigate between topics during study sessions

---

### 6. Learning Moments (Clips)
**Location**: Accessible from tutor sessions and dashboard

**What it does**:
- Save important Q&A exchanges from tutor sessions
- Organize clips into folders
- Tag clips for easy retrieval
- Review clips in context or start new sessions

**Features**:
- Save any assistant response as a clip
- Add title, folder, and tags
- Search and filter clips
- Jump back to original conversation
- Delete clips when no longer needed

---

### 7. ForgeMap (Concept Mapping)
**Location**: Available in tutor sessions

**What it does**:
- Generate visual concept maps from tutor responses
- Shows relationships between concepts
- Helps visualize complex topics

**Features**:
- Click "Show Map" on any assistant response
- AI generates structured concept map
- Visual representation of key concepts and connections

---

### 8. Exam Mode
**Location**: Accessible from tutor interface

**What it does**:
- Practice NCLEX-style questions
- Timed or untimed practice
- Immediate feedback and explanations
- Track performance over time

**Features**:
- Select exam type (NCLEX-RN, NCLEX-PN, custom)
- Choose number of questions
- Review answers with detailed rationales
- Performance analytics

---

## User Lifecycle

### 1. Signup & Onboarding
- Email/password signup (no email verification required)
- Automatic profile creation via database trigger
- Redirect to checkout for subscription

### 2. Subscription (Stripe)
- $24.99/month with 7-day free trial
- Stripe Checkout integration
- Webhook-based subscription sync
- Automatic retry for failed webhooks
- Subscription status tracked in database

### 3. Setup
- Add classes and upload materials
- Materials are processed and vectorized
- Ready to start studying

### 4. Study Flow
- Start tutor session (general or class-specific)
- Ask questions or work through cases
- AI references uploaded materials
- Save important moments as clips
- Flag difficult Q&A pairs for review

### 5. Progress Tracking
- Dashboard shows study vitals
- Review flagged content
- Browse saved clips
- Track activity by class

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components + shadcn/ui
- **State Management**: React Context (TutorContext, DensityContext)
- **AI Integration**: Vercel AI SDK (@ai-sdk/react)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (file uploads)
- **Vector Search**: pgvector extension
- **AI**: OpenAI API (GPT-4)
- **Payments**: Stripe (subscriptions)

### Key Database Tables
- `profiles`: User profiles (name, graduation date, program track)
- `student_classes`: Classes created by students
- `documents`: Uploaded files with vector embeddings
- `chats`: Tutor sessions
- `messages`: Chat messages
- `saved_clips`: Saved learning moments
- `notebook_topics`: Study topics within classes
- `word_bank`: Saved medical terms
- `webhook_events`: Stripe webhook tracking

### Security
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Service role used for admin operations
- Secure file storage with signed URLs

---

## AI System Prompt (Key Behaviors)

### Core Identity
- Educational tutor ONLY (not a clinician)
- Never gives real-world medical advice
- Keeps everything framed as exam prep

### Scope
- **In scope**: All nursing/medical topics, NCLEX prep, nursing calculations
- **Out of scope**: Non-medical topics, general life advice, non-nursing homework

### Response Structure (Required Order)
1. **Quick Orientation** (1-2 lines)
2. **THE MAP** (visual structure: flow, decision tree, priority ladder)
3. **Step-by-Step Reasoning** (explain inside the map)
4. **Common Trap** (1 sentence)
5. **Link Back to Materials** (if binder context exists)
6. **1-Line Chart Memory** (optional mnemonic)
7. **Mini Check-for-Understanding** (1 question)
8. **Confidence Anchor** (sparingly)

### Key Frameworks
- ABCs (Airway, Breathing, Circulation)
- Maslow's Hierarchy
- Safety and Risk Reduction
- Stable vs Unstable
- Acute vs Chronic
- Least Invasive First

### Tone
- Calm, encouraging, non-judgmental
- Normalizes confusion
- Praises process, not just answers
- No hype language ("crush", "ace", "smash")

---

## Reliability Fixes (Completed)

### 1. Email Verification UI Removal
- Removed obsolete verification polling
- Simplified signup flow (signup → session → checkout)
- Reduced code by 54%

### 2. Webhook Retry Mechanism
- Database tracking for all webhook events
- Automatic retry for failed webhooks
- Vercel cron job (every 5 minutes)
- Prevents subscription sync failures

### 3. Database Trigger Monitoring
- Health check endpoint for trigger status
- Detects orphaned users (users without profiles)
- One-click repair operation
- Prevents auth state breakage

### 4. Password Confirmation
- Users must enter password twice
- Real-time validation with visual feedback
- Prevents typos during signup

### 5. Anti-Bot Measures
- Honeypot field (invisible to users)
- Time-based detection (< 3 seconds = bot)
- Interaction detection (no clicks = bot)
- All invisible to legitimate users

### 6. Landing Page Optimization
- Enhanced SEO metadata
- Stronger hook and value proposition
- Price transparency ($24.99/mo, 7-day trial)
- Consistent CTAs ("Start Your 7-Day Free Trial")
- Removed fake social proof (ethical marketing)

---

## Current Status

**Production**: Live at forgenursing.com (assumed)
**Customers**: 1 paying customer
**Stage**: Early access / pilot testing

---

## Key Differentiators

1. **Uses student's own materials**: Not generic NCLEX content
2. **Visual learning**: Every response includes a map/structure
3. **Framework-driven**: Explicitly teaches NCLEX reasoning frameworks
4. **Socratic method**: Checks understanding after each explanation
5. **Context-aware**: References specific files and pages
6. **Organized by classes**: Mirrors student's actual coursework
7. **Progress tracking**: Study vitals and flagged content
8. **Learning library**: Save and organize important moments

---

## Future Considerations

Based on the codebase, potential areas for expansion:
- Exam mode enhancements (more question types, performance analytics)
- Collaborative study features (study groups, shared clips)
- Mobile app (React Native)
- Instructor dashboard (for nursing programs)
- Integration with LMS platforms (Canvas, Blackboard)
- More AI models (Claude, Gemini) for comparison
- Voice input/output for hands-free study
- Spaced repetition system for saved clips
- Progress reports for instructors/advisors
