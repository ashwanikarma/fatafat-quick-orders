
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  current_step INTEGER NOT NULL DEFAULT 0,
  sponsor_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  kyc_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_premium NUMERIC DEFAULT 0,
  quotation_id TEXT,
  policy_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotations" ON public.quotations
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quotations" ON public.quotations
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations" ON public.quotations
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations" ON public.quotations
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
