-- ==============================================================================
-- GapFinder AI - Supabase Database Schema & Vector Search (pgvector)
-- ==============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    target_exam_date DATE,
    daily_study_minutes INTEGER NOT NULL DEFAULT 60,
    preferred_study_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('syllabus', 'textbook', 'notes', 'exam_paper')),
    file_size BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
    error_message TEXT,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Document Chunks Table with 768-dim Vector Embeddings (Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER,
    section_heading TEXT,
    token_count INTEGER,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chunks_material_id ON public.document_chunks(material_id);
CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON public.document_chunks(user_id);

-- 5. Topics Table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    parent_unit TEXT NOT NULL DEFAULT 'Core Concepts',
    order_index INTEGER NOT NULL DEFAULT 0,
    source_material_ids UUID[] DEFAULT ARRAY[]::UUID[],
    prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, code)
);

-- 6. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    quiz_type TEXT NOT NULL CHECK (quiz_type IN ('topic', 'mixed_diagnostic')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'mixed')),
    total_questions INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Quiz Questions Table (Correct answers kept securely on server)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'mixed')),
    rubric_criteria JSONB,
    source_citation JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_score NUMERIC NOT NULL DEFAULT 0,
    max_score NUMERIC NOT NULL DEFAULT 0,
    percentage NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 9. Student Answers Table
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    student_answer TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('correct', 'partially_correct', 'incorrect')),
    marks_earned NUMERIC NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL DEFAULT '',
    mistakes_identified JSONB DEFAULT '[]'::jsonb,
    concepts_to_revise JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Topic Mastery Table
CREATE TABLE IF NOT EXISTS public.topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    mastery_percentage NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'untested' CHECK (status IN ('weak', 'medium', 'strong', 'untested')),
    questions_attempted INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    incorrect_answers INTEGER NOT NULL DEFAULT 0,
    repeated_mistakes JSONB DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL DEFAULT 'Not enough evidence yet.',
    last_attempt_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, topic_id)
);

-- 11. Revision Plans Table
CREATE TABLE IF NOT EXISTS public.revision_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_date DATE,
    daily_study_minutes INTEGER NOT NULL DEFAULT 60,
    total_days INTEGER NOT NULL DEFAULT 7,
    total_required_minutes INTEGER NOT NULL DEFAULT 0,
    warning_notice TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Revision Tasks Table
CREATE TABLE IF NOT EXISTS public.revision_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.revision_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    scheduled_date DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    learning_activity TEXT NOT NULL CHECK (learning_activity IN ('concept_review', 'practice_problems', 'deep_dive', 'self_quiz')),
    activity_title TEXT NOT NULL,
    rationale TEXT NOT NULL,
    source_citation JSONB,
    follow_up_quiz_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Chat Messages (Topic Assistant)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. Vector Semantic Search Function
CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT,
    p_user_id UUID,
    p_material_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    material_id UUID,
    file_name TEXT,
    content TEXT,
    chunk_index INT,
    page_number INT,
    section_heading TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.material_id,
        m.file_name,
        dc.content,
        dc.chunk_index,
        dc.page_number,
        dc.section_heading,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    JOIN public.materials m ON m.id = dc.material_id
    WHERE dc.user_id = p_user_id
      AND (p_material_ids IS NULL OR dc.material_id = ANY(p_material_ids))
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 15. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 16. RLS Policies (Owner isolation)
CREATE POLICY "Users can access their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can access their own materials" ON public.materials
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own document chunks" ON public.document_chunks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own topics" ON public.topics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own quizzes" ON public.quizzes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access questions of their quizzes" ON public.quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = quiz_questions.quiz_id AND q.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own attempts" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access answers of their attempts" ON public.student_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts qa
            WHERE qa.id = student_answers.attempt_id AND qa.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can access their own topic mastery" ON public.topic_mastery
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own revision plans" ON public.revision_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own revision tasks" ON public.revision_tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own chat messages" ON public.chat_messages
    FOR ALL USING (auth.uid() = user_id);
