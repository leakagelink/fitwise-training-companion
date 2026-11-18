CREATE TABLE public.phone_otps (
  phone text PRIMARY KEY,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  window_start timestamptz NOT NULL DEFAULT now(),
  window_count int NOT NULL DEFAULT 1
);
GRANT ALL ON public.phone_otps TO service_role;
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.find_user_by_phone(_phone text)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$ select u.id, u.email::text from auth.users u where u.phone = ltrim(_phone, '+') or u.phone = _phone limit 1 $$;
REVOKE ALL ON FUNCTION public.find_user_by_phone(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_phone(text) TO service_role;