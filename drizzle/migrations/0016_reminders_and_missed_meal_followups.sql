CREATE TABLE public.reminder_settings (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  breakfast_on boolean NOT NULL DEFAULT true,
  breakfast_at time NOT NULL DEFAULT '08:30',
  lunch_on boolean NOT NULL DEFAULT true,
  lunch_at time NOT NULL DEFAULT '13:30',
  dinner_on boolean NOT NULL DEFAULT true,
  dinner_at time NOT NULL DEFAULT '20:30',
  water_on boolean NOT NULL DEFAULT true,
  water_start time NOT NULL DEFAULT '09:00',
  water_end time NOT NULL DEFAULT '21:00',
  water_every_hours smallint NOT NULL DEFAULT 2 CHECK (water_every_hours BETWEEN 1 AND 6),
  workout_on boolean NOT NULL DEFAULT true,
  workout_at time NOT NULL DEFAULT '18:00',
  missed_meal_followup boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_settings TO authenticated;
GRANT ALL ON public.reminder_settings TO service_role;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reminder settings" ON public.reminder_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.meal_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  reason text CHECK (reason IS NULL OR char_length(reason) <= 200),
  status text NOT NULL CHECK (status IN ('logged', 'skipped', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, meal_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_followups TO authenticated;
GRANT ALL ON public.meal_followups TO service_role;
ALTER TABLE public.meal_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own meal follow-ups" ON public.meal_followups FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());