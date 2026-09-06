CREATE TABLE public.fare_watches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  origin text NOT NULL DEFAULT 'TPE',
  destination_code text NOT NULL,
  destination_name text NOT NULL,
  destination_zh text,
  target_price integer NOT NULL,
  current_lowest integer,
  previous_price integer,
  status text NOT NULL DEFAULT 'watching',
  notify_on_drop boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fare_watches TO authenticated;
GRANT ALL ON public.fare_watches TO service_role;
ALTER TABLE public.fare_watches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own watches" ON public.fare_watches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);