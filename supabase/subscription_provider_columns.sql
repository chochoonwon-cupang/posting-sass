-- 기존 subscriptions 테이블에 결제사 연동 컬럼 추가
-- subscription_cart.sql 실행 후 테이블이 이미 있는 경우에만 실행하세요.

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMPTZ;
