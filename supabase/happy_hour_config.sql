-- Supabase SQL Editor에서 실행하세요.
-- happy_hour_config 테이블 (싱글 row)

CREATE TABLE public.happy_hour_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  start_time TIME NOT NULL DEFAULT '14:00',
  end_time TIME NOT NULL DEFAULT '16:00',
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.happy_hour_config (id, start_time, end_time, enabled)
VALUES (1, '14:00', '16:00', true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.happy_hour_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read" ON public.happy_hour_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update" ON public.happy_hour_config FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can insert" ON public.happy_hour_config FOR INSERT TO authenticated WITH CHECK (true);
