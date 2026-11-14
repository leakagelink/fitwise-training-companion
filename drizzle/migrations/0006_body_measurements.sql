CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  measured_on date NOT NULL DEFAULT CURRENT_DATE,
  waist_cm numeric,
  chest_cm numeric,
  hips_cm numeric,
  arm_cm numeric,
  body_fat_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, measured_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated;
GRANT ALL ON public.body_measurements TO service_role;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own measurements" ON public.body_measurements FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);