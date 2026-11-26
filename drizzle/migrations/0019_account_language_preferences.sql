CREATE TABLE public.account_languages (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 language_code text NOT NULL CHECK (language_code ~ '^[a-z]{2}(-[A-Za-z]{2,4})?$'),
 selected_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_languages TO authenticated;
GRANT ALL ON public.account_languages TO service_role;
ALTER TABLE public.account_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY account_language_owner ON public.account_languages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.language_translations (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 language_code text NOT NULL,
 source_hash text NOT NULL,
 source_text text NOT NULL CHECK (length(source_text) BETWEEN 1 AND 4000),
 translated_text text NOT NULL CHECK (length(translated_text) BETWEEN 1 AND 12000),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, language_code, source_hash)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.language_translations TO authenticated;
GRANT ALL ON public.language_translations TO service_role;
ALTER TABLE public.language_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY language_translation_owner ON public.language_translations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX language_translations_owner_created ON public.language_translations(user_id, created_at DESC);