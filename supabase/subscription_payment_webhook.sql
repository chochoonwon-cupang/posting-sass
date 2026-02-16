-- 구독 결제 웹훅: payment_events + apply_subscription_payment RPC
-- Supabase SQL Editor에서 실행하세요.
--
-- 결제사 payment_succeeded 이벤트 수신 시 apply_subscription_payment 호출
-- 중복 이벤트는 (provider, provider_event_id) 유니크로 자동 무시
--
-- subscriptions.status 컬럼 필요 (active 등):
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'paid',
  purpose TEXT,
  event_type TEXT,
  raw JSONB,
  provider_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_event_id)
);

-- 기존 테이블에 컬럼 추가
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS raw JSONB;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;
ALTER TABLE public.payment_events ALTER COLUMN subscription_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_provider_event
  ON public.payment_events (provider, provider_event_id);

-- RLS: prepare 시 authenticated 유저가 본인 구독에 대해 ready 이벤트 insert
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert ready payment_events for self"
  ON public.payment_events FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'ready'
    AND (
      user_id = auth.uid()
      OR (subscription_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.subscriptions s
        WHERE s.id = subscription_id AND s.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Authenticated can select own payment_events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (subscription_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    ))
  );

CREATE POLICY "Authenticated can update own payment_events status"
  ON public.payment_events FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (subscription_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (subscription_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    ))
  );

CREATE POLICY "Service role full access"
  ON public.payment_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- apply_subscription_payment: 웹훅에서 호출, 중복 시 무시
-- service_role로 호출 (웹훅 서버용)
CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
  p_provider TEXT,
  p_provider_event_id TEXT,
  p_user_id UUID,
  p_amount INT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_subscription_id UUID;
  v_event_id UUID;
  v_new_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  SELECT id INTO v_subscription_id
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'subscription_not_found');
  END IF;

  -- 중복 이벤트: (provider, provider_event_id) 유니크로 upsert, 이미 있으면 무시
  INSERT INTO public.payment_events (provider, provider_event_id, subscription_id, amount, status, event_type)
  VALUES (p_provider, p_provider_event_id, v_subscription_id, p_amount, 'paid', 'payment.succeeded')
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    -- 이미 처리된 이벤트 (중복)
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  -- 잔액 충전 + ledger 기록
  UPDATE public.users
  SET balance = balance + p_amount
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  INSERT INTO public.wallet_ledger (user_id, amount, reason, ref_id)
  VALUES (v_user_id, p_amount, 'sub_payment', gen_random_uuid());

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'event_id', v_event_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(TEXT, TEXT, UUID, INT) TO service_role;

-- apply_charge_payment: 충전 결제 시 잔액 추가
CREATE OR REPLACE FUNCTION public.apply_charge_payment(
  p_provider TEXT,
  p_provider_event_id TEXT,
  p_user_id UUID,
  p_amount INT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_new_balance INT;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  INSERT INTO public.payment_events (provider, provider_event_id, user_id, amount, status, event_type)
  VALUES (p_provider, p_provider_event_id, p_user_id, p_amount, 'paid', 'payment.succeeded')
  ON CONFLICT (provider, provider_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  UPDATE public.users
  SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  INSERT INTO public.wallet_ledger (user_id, amount, reason, ref_id)
  VALUES (p_user_id, p_amount, 'charge', gen_random_uuid());

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'event_id', v_event_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_charge_payment(TEXT, TEXT, UUID, INT) TO service_role;
