# GapFinder AI

> **Discover your knowledge gaps. Study smarter.**

GapFinder AI is a full-stack educational SaaS application that helps students identify knowledge gaps, generate diagnostic quizzes grounded in their own uploaded study materials, and receive an adaptive personalised revision plan.

---

## Problem Statement

Students often study broadly without knowing which specific topics they're weak on. Traditional past papers don't explain *why* a student fails or provide a targeted remediation strategy. GapFinder AI solves this by:

1. Ingesting the student's own syllabus, textbook chapters, and notes.
2. Mapping the curriculum into a structured topic hierarchy.
3. Running RAG-grounded diagnostic quizzes (questions derived from the student's materials).
4. Diagnosing weak, medium, and strong topics with verifiable evidence.
5. Generating an adaptive day-by-day revision plan prioritised by mastery gaps and exam timeline.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes (Edge-compatible) |
| AI | Google Gemini 1.5 Flash (generation) + text-embedding-004 (embeddings) |
| Database | Supabase PostgreSQL + pgvector (vector search) |
| Auth | Supabase Auth (+ localStorage demo mode) |
| Storage | Supabase Storage (private bucket) |
| Deployment | Vercel |

---

## Architecture Diagram

```mermaid
flowchart TD
    A[Student Browser] -->|Upload PDF/TXT| B[Next.js API Route: /api/materials/upload]
    B -->|Extract text| C[DocumentProcessor]
    C -->|Chunk with overlap| D[Chunks]
    D -->|Embed via Gemini text-embedding-004| E[RagService.generateEmbedding]
    E -->|Store vector + metadata| F[(Supabase pgvector)]

    G[Quiz Request] -->|Topic + Difficulty| H[/api/quiz/generate]
    H -->|Semantic query embedding| I[RagService.retrieveRelevantChunks]
    I -->|pgvector cosine similarity search| F
    F -->|Top-K chunks with citations| J[Retrieved Context]
    J -->|Grounded prompt + chunks| K[Gemini 1.5 Flash]
    K -->|Structured JSON questions| L[Quiz Questions Stored]
    L -->|Client-safe questions (no answers)| A

    A -->|Submit answers| M[/api/quiz/submit]
    M -->|MCQ: deterministic| N[ScoringEngine.evaluateMultipleChoice]
    M -->|Short answer: semantic| O[AiService.evaluateShortAnswer]
    N --> P[EvaluatedResults]
    O --> P
    P -->|Recalculate per-topic mastery| Q[ScoringEngine.calculateTopicMastery]
    Q -->|Persist mastery| F

    R[/api/planner/generate] -->|Weak+Medium topics + exam date| S[RevisionPlanner.generatePlan]
    S -->|Urgency scoring + day allocation| T[RevisionPlan + Tasks]

    U[Explain Assistant] -->|Natural language question| V[/api/explain]
    V -->|RAG retrieval| I
    J -->|Evidence context| W[AiService.explainTopic]
    W -->|Answer + citations| A
```

---

## RAG Pipeline & Citations

**Document Upload → Retrieval → Grounded Generation**

1. **Text Extraction**: PDF text is extracted via `pdf-parse`. TXT files decoded as UTF-8. Scanned image PDFs require OCR (not included — user is warned).
2. **Chunking**: Text split into ~600-char overlapping segments (100-char overlap). Section headings (`[Chapter X: Section Y]`, `UNIT N:`) are detected and preserved as chunk metadata.
3. **Embedding**: Each chunk embedded with Gemini `text-embedding-004` (768-dimensional float vectors).
4. **Storage**: Vectors stored in Supabase `document_chunks` table with pgvector column. Filtered strictly by `user_id`.
5. **Retrieval**: `match_document_chunks` SQL function performs cosine similarity search: `1 - (embedding <=> query_vector)`. Threshold: 0.35 cosine similarity. Returns top-K chunks.
6. **Citation**: Every retrieved chunk carries `fileName`, `pageNumber`, `sectionHeading`, and content excerpt. These are passed verbatim into AI prompts and returned to the frontend.
7. **Grounding Rule**: AI prompts instruct Gemini to make ONLY claims verifiable in the retrieved excerpts. If no relevant evidence exists, the system reports "insufficient evidence" rather than hallucinating.

---

## AI Workflow: Retrieval vs Generation

| Phase | Component | Role |
|---|---|---|
| Retrieval | `RagService` | Pure vector search — no AI generation. Returns ranked chunks. |
| Generation | `AiService` | Takes retrieved chunks as context. Generates grounded questions or explanations. |
| Evaluation | `AiService.evaluateShortAnswer` | Semantic correctness checking of student free-text responses. |
| Scoring | `ScoringEngine` | Deterministic mathematical mastery calculation. Not AI-generated. |
| Planning | `RevisionPlanner` | Pure algorithmic scheduling. Not AI-generated. |

---

## Answer Evaluation & Gap-Analysis Logic

- **MCQ**: Deterministic string comparison between student answer and stored key (letter-prefix or full text match).
- **Short Answer**: Gemini evaluates semantic correctness returning `correct`/`partially_correct`/`incorrect` + marks earned + specific mistakes. Falls back to keyword-overlap heuristic when API unavailable.
- **Mastery Calculation**:
  - Weak: `percentage < 50%`
  - Medium: `50% ≤ percentage < 80%`
  - Strong: `percentage ≥ 80%`
  - Untested: fewer than 2 questions attempted.
  - Mastery is **cumulative** across all attempts for a topic, not reset per quiz.
  - Repeated mistakes are tracked across sessions.

---

## Adaptive Revision Plan Logic

1. All topics scored with an urgency weight: Weak topics score highest (100 − mastery + 50 bonus), Medium next, Untested moderate, Strong lowest.
2. Topics sorted descending by urgency.
3. Tasks allocated into preferred study days starting tomorrow, respecting `dailyStudyMinutes` budget.
4. If total required time exceeds available time before exam, a warning is surfaced.
5. Completed tasks are preserved across plan regenerations.
6. Activity types assigned by mastery: Weak → `concept_review` (45 min), Medium → `practice_problems` (30 min), Untested → `self_quiz` (25 min), Strong → `deep_dive` (15 min).

---

## Database Schema

See `supabase/migrations/20261026000000_init_gapfinder.sql` for the complete schema.

Key tables:
- `profiles` — user settings, exam date, study preferences.
- `materials` — uploaded documents with processing status.
- `document_chunks` — text chunks with `VECTOR(768)` embeddings.
- `topics` — structured topic hierarchy from syllabus.
- `quiz_questions` — questions with correct answers (never exposed client-side before submission).
- `quiz_attempts` + `student_answers` — persistent attempt records.
- `topic_mastery` — cumulative per-topic mastery scores.
- `revision_plans` + `revision_tasks` — adaptive schedule.
- `chat_messages` — topic assistant history (private per user).

---

## Installation & Environment Setup

### Prerequisites
- Node.js ≥ 18
- A Supabase project (free tier works)
- Google AI Studio API key (Gemini)

### 1. Clone and install
```bash
git clone <repo-url>
cd gapfinder-ai
npm install
```

### 2. Copy environment file
```bash
cp .env.example .env.local
```

### 3. Fill in `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

---

## Supabase Configuration & Migrations

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run the contents of `supabase/migrations/20261026000000_init_gapfinder.sql`.
3. Enable `pgvector` extension in **Database → Extensions**.
4. Create a private storage bucket named `study-materials` in **Storage**.
5. RLS policies are included in the migration — they enforce user isolation.

---

## Sample Data Setup

The app auto-seeds demo data on first load. To manually seed:

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates:
- Demo student profile (Alex Chen).
- 8 CS101 Python topics across 5 units.
- 5 sample educational documents (syllabus, textbook chapters, notes).
- Pre-loaded benchmark mastery scores to demonstrate the dashboard immediately.

**All sample data is clearly labelled as demo content. Pre-loaded scores are sample benchmarks, not real diagnostic outcomes.**

---

## Local Execution & Testing

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
```

Navigate to `http://localhost:3000`. Log in with any email and any password — demo mode accepts all credentials.

### Running Tests
```bash
node --test tests/scoring.test.mjs
node --test tests/chunking.test.mjs
```

---

## Vercel Deployment

1. Push code to GitHub.
2. Import project in [vercel.com](https://vercel.com).
3. Add environment variables (same as `.env.local`).
4. Deploy. Vercel auto-detects Next.js.

The `next.config.mjs` marks `pdf-parse` as a server-only external package compatible with Vercel's Node.js runtime.

---

## Demo Account Setup

No hardcoded credentials exist. The application operates in demo mode automatically:

1. Open `http://localhost:3000`.
2. Click **Get Started** or navigate to `/login`.
3. Enter **any email and password** (e.g., `demo@gapfinder.edu` / `demo1234`).
4. You are immediately logged in as **Alex Chen (Demo Student)** with preloaded sample data.

For judges: sample materials are seeded automatically. Upload additional PDFs or TXT files from `sample-data/` using the Materials page to test the full RAG pipeline.

---

## Limitations & Future Enhancements

**Current Limitations:**
- Demo mode uses in-memory storage (data resets on server restart). Full Supabase integration requires environment credentials.
- Scanned image PDFs require an OCR preprocessing step (e.g., Tesseract) not included in MVP.
- Short-answer evaluation quality depends on Gemini API availability.
- pgvector retrieval requires Supabase; falls back to keyword heuristic in demo mode.

**Future Enhancements:**
- Teacher class-level analytics dashboard.
- Parent progress tracking portal.
- Spaced-repetition reminder notifications (email/push).
- Multi-language support for non-English syllabuses.
- LMS integration (Canvas, Moodle, Google Classroom).
- OCR pipeline for scanned textbooks.
- Flashcard generation from weak topics.
- Mobile app (React Native).
