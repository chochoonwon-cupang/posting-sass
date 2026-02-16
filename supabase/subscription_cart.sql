-- 구독 장바구니: subscriptions 테이블 + sub_cart_add RPC
-- Supabase SQL Editor에서 실행하세요.
--
-- m300=30만, m500=50만, m1000=100만
-- bonus_rate: calc_bonus_rate(monthly_amount)로 계산 (0, 0.10, 0.20, 0.30)

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  m300_qty INT NOT NULL DEFAULT 0 CHECK (m300_qty >= 0),
  m500_qty INT NOT NULL DEFAULT 0 CHECK (m500_qty >= 0),
  m1000_qty INT NOT NULL DEFAULT 0 CHECK (m1000_qty >= 0),
  monthly_amount INT NOT NULL DEFAULT 0,
  bonus_rate NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (bonus_rate IN (0, 0.10, 0.20, 0.30)),
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'cancelled')),
  next_billing_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기존 테이블에 컬럼 추가 시 (이미 생성된 경우):
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
-- ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ;
-- bonus_rate 타입 변경 시 (기존 10,20,30 -> 0.10,0.20,0.30):
-- ALTER TABLE public.subscriptions ALTER COLUMN bonus_rate TYPE NUMERIC(3,2) USING (bonus_rate::numeric/100);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- calc_bonus_rate(monthly_amount): 300만 이상 0.30, 100만 이상 0.20, >0 0.10, 0이면 0
CREATE OR REPLACE FUNCTION public.calc_bonus_rate(p_monthly_amount INT)
RETURNS NUMERIC(3,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_monthly_amount <= 0 THEN
    RETURN 0;
  ELSIF p_monthly_amount >= 3000000 THEN
    RETURN 0.30;
  ELSIF p_monthly_amount >= 1000000 THEN
    RETURN 0.20;
  ELSE
    RETURN 0.10;
  END IF;
END;
$$;

-- ensure_draft_subscription(p_user_id): draft 구독이 없으면 생성, subscription_id 반환
CREATE OR REPLACE FUNCTION public.ensure_draft_subscription(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT id INTO v_id
  FROM public.subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.subscriptions (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_draft_subscription(UUID) TO authenticated;

-- sub_cart_add(p_subscription_id, p_sku, p_delta)
CREATE OR REPLACE FUNCTION public.sub_cart_add(
  p_subscription_id UUID,
  p_sku TEXT,
  p_delta INT DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_m300 INT;
  v_m500 INT;
  v_m1000 INT;
  v_amount INT;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.subscriptions
  WHERE id = p_subscription_id AND user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'subscription not found or access denied';
  END IF;

  IF p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_sku NOT IN ('300000', '500000', '1000000') THEN
    RAISE EXCEPTION 'invalid sku: %', p_sku;
  END IF;

  UPDATE public.subscriptions
  SET
    m300_qty = CASE WHEN p_sku = '300000' THEN GREATEST(0, m300_qty + p_delta) ELSE m300_qty END,
    m500_qty = CASE WHEN p_sku = '500000' THEN GREATEST(0, m500_qty + p_delta) ELSE m500_qty END,
    m1000_qty = CASE WHEN p_sku = '1000000' THEN GREATEST(0, m1000_qty + p_delta) ELSE m1000_qty END,
    updated_at = NOW()
  WHERE id = p_subscription_id
  RETURNING m300_qty, m500_qty, m1000_qty INTO v_m300, v_m500, v_m1000;

  v_amount := 300000 * v_m300 + 500000 * v_m500 + 1000000 * v_m1000;

  UPDATE public.subscriptions
  SET monthly_amount = v_amount,
      bonus_rate = CASE
        WHEN v_amount >= 3000000 THEN 30
        WHEN v_amount >= 1000000 THEN 20
        WHEN v_amount > 0 THEN 10
        ELSE 10
      END,
      updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sub_cart_add(UUID, TEXT, INT) TO authenticated;

-- sub_cart_reset(p_subscription_id): 장바구니 수량 초기화 (0원)
CREATE OR REPLACE FUNCTION public.sub_cart_reset(p_subscription_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET m300_qty = 0,
      m500_qty = 0,
      m1000_qty = 0,
      monthly_amount = 0,
      bonus_rate = 10,
      updated_at = NOW()
  WHERE id = p_subscription_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription not found or access denied';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sub_cart_reset(UUID) TO authenticated;

-- sub_cart_set_qty(p_subscription_id, p_m300, p_m500, p_m1000): 수량 직접 설정 (deprecated, 수량 직접입력 제거됨)
CREATE OR REPLACE FUNCTION public.sub_cart_set_qty(
  p_subscription_id UUID,
  p_m300 INT DEFAULT 0,
  p_m500 INT DEFAULT 0,
  p_m1000 INT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_m300 INT := GREATEST(0, COALESCE(p_m300, 0));
  v_m500 INT := GREATEST(0, COALESCE(p_m500, 0));
  v_m1000 INT := GREATEST(0, COALESCE(p_m1000, 0));
  v_amount INT;
  v_rate INT;
BEGIN
  UPDATE public.subscriptions
  SET m300_qty = v_m300,
      m500_qty = v_m500,
      m1000_qty = v_m1000,
      updated_at = NOW()
  WHERE id = p_subscription_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription not found or access denied';
  END IF;

  v_amount := 300000 * v_m300 + 500000 * v_m500 + 1000000 * v_m1000;

  IF v_amount >= 3000000 THEN
    v_rate := 30;
  ELSIF v_amount >= 1000000 THEN
    v_rate := 20;
  ELSE
    v_rate := 10;
  END IF;

  UPDATE public.subscriptions
  SET monthly_amount = v_amount,
      bonus_rate = v_rate,
      updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sub_cart_set_qty(UUID, INT, INT, INT) TO authenticated;

-- activate_subscription: 결제사 구독 생성 후 status=active로 활성화
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_subscription_id UUID,
  p_provider TEXT,
  p_provider_customer_id TEXT,
  p_provider_subscription_id TEXT,
  p_next_billing_at TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'active',
      provider_subscription_id = p_provider_subscription_id,
      provider_customer_id = p_provider_customer_id,
      next_billing_at = p_next_billing_at,
      updated_at = NOW()
  WHERE id = p_subscription_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'subscription not found or access denied';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_subscription(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
