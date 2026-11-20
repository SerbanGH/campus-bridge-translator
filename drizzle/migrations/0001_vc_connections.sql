CREATE TABLE public.vc_connections (
  user_id uuid PRIMARY KEY,
  moodle_user_id integer NOT NULL,
  fullname text NOT NULL,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.vc_connections TO service_role;
ALTER TABLE public.vc_connections ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated: the Virtual Campus key is only handled by server code.