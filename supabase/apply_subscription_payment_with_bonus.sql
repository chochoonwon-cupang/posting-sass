-- Supabase SQL Editor에서 실행하세요.
-- apply_subscription_payment: p_bonus 파라미터 추가 (구독 결제 시 보너스 크레딧 포함)

DROP FUNCTION IF EXISTS public.apply_subscription_payment(TEXT, TEXT, UUID, INT);

CREATE OR REPLACE FUNCTION public.apply_subscription_payment(
  p_provider TEXT,
  p_provider_event_id TEXT,
  p_user_id UUID,
  p_amount INT,
  p_bonus INT DEFAULT 0
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
  v_total INT := p_amount + COALESCE(p_bonus, 0);
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
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  -- 잔액 충전 (결제금액 + 보너스) + ledger 기록
  UPDATE public.users
  SET balance = balance + v_total
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  INSERT INTO public.wallet_ledger (user_id, amount, reason, ref_id)
  VALUES (v_user_id, v_total, 'sub_payment', gen_random_uuid());

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'event_id', v_event_id,
    'amount', p_amount,
    'bonus', COALESCE(p_bonus, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_subscription_payment(TEXT, TEXT, UUID, INT, INT) TO service_role;

NOTIFY pgrst, 'reload schema';
