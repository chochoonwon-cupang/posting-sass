-- Supabase SQL Editor에서 실행하세요.
-- apply_charge_payment: 충전 결제 시 wallet_ledger 기록 + users.balance 증가 + payment_events 업데이트
--
-- 스키마 가정:
--   public.users: balance 컬럼
--   public.wallet_ledger: user_id, amount, reason, ref_id
--   public.payment_events: provider, provider_event_id, event_type

CREATE OR REPLACE FUNCTION public.apply_charge_payment(
  p_provider TEXT,
  p_provider_event_id TEXT,
  p_user_id UUID,
  p_amount INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1) wallet_ledger에 충전 기록 (프로젝트 스키마: user_id, amount, reason, ref_id)
  -- ref_id: 기존 패턴(place_bid 등)이 UUID 사용. gen_random_uuid() 사용.
  -- ref_id를 TEXT로 쓰는 프로젝트면 p_provider_event_id로 교체 가능
  INSERT INTO public.wallet_ledger (
    user_id,
    amount,
    reason,
    ref_id
  )
  VALUES (
    p_user_id,
    p_amount,
    'charge',
    gen_random_uuid()
  );

  -- 2) users.balance 증가
  UPDATE public.users
  SET balance = coalesce(balance, 0) + p_amount
  WHERE id = p_user_id;

  -- 3) payment_events 성공 기록 (confirm에서 이미 업데이트했을 수 있음, 동기화용)
  UPDATE public.payment_events
  SET event_type = 'charge.succeeded'
  WHERE provider = p_provider
    AND (provider_event_id = p_provider_event_id OR provider_payment_id = p_provider_event_id);

END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_charge_payment(TEXT, TEXT, UUID, INT) TO service_role;

-- PostgREST 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
