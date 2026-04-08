CREATE TABLE public.study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source_type text DEFAULT 'document_generated',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.study_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.study_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.study_notes FOR DELETE USING (auth.uid() = user_id);