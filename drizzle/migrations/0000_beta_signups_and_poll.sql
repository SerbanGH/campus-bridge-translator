CREATE TABLE public.beta_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact text NOT NULL CHECK (char_length(btrim(contact)) BETWEEN 2 AND 120),
  home_country text NOT NULL CHECK (char_length(btrim(home_country)) BETWEEN 2 AND 60),
  faculty text NOT NULL CHECK (faculty IN ('AC','ETC','Mecanică','Arhitectură','Construcții','Chimie','MPT')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.beta_signups TO anon, authenticated;
GRANT ALL ON public.beta_signups TO service_role;
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join the beta" ON public.beta_signups
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id text NOT NULL CHECK (option_id IN ('materials','courses','bureaucracy','dorm')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.poll_votes TO anon, authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can vote" ON public.poll_votes
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_signup_count()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT count(*)::int FROM public.beta_signups $$;

CREATE OR REPLACE FUNCTION public.get_poll_results()
RETURNS TABLE(option_id text, votes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT option_id, count(*)::int FROM public.poll_votes GROUP BY option_id $$;

REVOKE ALL ON FUNCTION public.get_signup_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_poll_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_signup_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_poll_results() TO anon, authenticated, service_role;