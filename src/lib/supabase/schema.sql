/*
 * users 테이블 생성 SQL
 * Supabase SQL Editor에서 실행하세요.
 *
 * CREATE TABLE public.users (
 *   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   balance INT NOT NULL DEFAULT 0,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * RLS 정책 (본인 데이터만 + 로그인 시 row 자동 생성용 INSERT)
 * ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
 * CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
 * CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
 */

/*
 * happy_hour_config 테이블 (싱글 row)
 *
 * CREATE TABLE public.happy_hour_config (
 *   id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
 *   start_time TIME NOT NULL DEFAULT '14:00',
 *   end_time TIME NOT NULL DEFAULT '16:00',
 *   enabled BOOLEAN NOT NULL DEFAULT true,
 *   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * INSERT INTO public.happy_hour_config (id, start_time, end_time, enabled)
 * VALUES (1, '14:00', '16:00', true)
 * ON CONFLICT (id) DO NOTHING;
 *
 * ALTER TABLE public.happy_hour_config ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Authenticated can read" ON public.happy_hour_config FOR SELECT TO authenticated USING (true);
 * CREATE POLICY "Authenticated can update" ON public.happy_hour_config FOR UPDATE TO authenticated USING (true);
 * CREATE POLICY "Authenticated can insert" ON public.happy_hour_config FOR INSERT TO authenticated WITH CHECK (true);
 */

/*
 * bids 테이블 및 RPC
 *
 * CREATE TABLE public.bids (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 *   keyword TEXT NOT NULL,
 *   phone TEXT,
 *   kakao TEXT,
 *   insta TEXT,
 *   address TEXT,
 *   place_url TEXT,
 *   bid_amount INT NOT NULL CHECK (bid_amount >= 70),
 *   posting_method TEXT NOT NULL DEFAULT 'direct' CHECK (posting_method IN ('direct', 'agency')),
 *   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
 *   publish_url TEXT,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view own bids" ON public.bids FOR SELECT USING (auth.uid() = user_id);
 * CREATE POLICY "Users can insert own bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = user_id);
 *
 * Realtime (대시보드 잔액 실시간 반영)
 * ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
 *
 * charge_balance(amount) - 잔액 충전
 * CREATE OR REPLACE FUNCTION public.charge_balance(amount int)
 * RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
 * AS $$
 * DECLARE new_balance int;
 * BEGIN
 *   IF amount <= 0 THEN
 *     RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
 *   END IF;
 *   UPDATE users SET balance = balance + amount WHERE id = auth.uid()
 *   RETURNING balance INTO new_balance;
 *   IF new_balance IS NULL THEN
 *     RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
 *   END IF;
 *   RETURN jsonb_build_object('success', true, 'balance', new_balance);
 * END;
 * $$;
 *
 * place_bid(...) - 입찰 등록 (잔액 차감)
 * bids 테이블에 bid_price, post_type, instagram, held_amount 컬럼 필요
 * wallet_ledger 테이블 필요
 *
 * CREATE OR REPLACE FUNCTION public.place_bid(
 *   p_keyword text,
 *   p_bid_amount integer,
 *   p_posting_method text,
 *   p_phone text,
 *   p_kakao text,
 *   p_insta text,
 *   p_address text,
 *   p_place_url text
 * )
 * RETURNS uuid
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * DECLARE
 *   v_user uuid := auth.uid();
 *   v_balance integer;
 *   v_bid_id uuid;
 * BEGIN
 *   IF v_user IS NULL THEN
 *     RAISE EXCEPTION 'not authenticated';
 *   END IF;
 *
 *   IF p_bid_amount < 70 THEN
 *     RAISE EXCEPTION 'min bid is 70';
 *   END IF;
 *
 *   SELECT balance INTO v_balance
 *   FROM public.users
 *   WHERE id = v_user
 *   FOR UPDATE;
 *
 *   IF v_balance < p_bid_amount THEN
 *     RAISE EXCEPTION 'insufficient balance';
 *   END IF;
 *
 *   UPDATE public.users
 *     SET balance = balance - p_bid_amount
 *   WHERE id = v_user;
 *
 *   INSERT INTO public.bids(
 *     user_id,
 *     keyword,
 *     bid_price,
 *     post_type,
 *     phone,
 *     kakao,
 *     instagram,
 *     address,
 *     place_url,
 *     status,
 *     held_amount
 *   )
 *   VALUES (
 *     v_user,
 *     p_keyword,
 *     p_bid_amount,
 *     p_posting_method,
 *     p_phone,
 *     p_kakao,
 *     p_insta,
 *     p_address,
 *     p_place_url,
 *     'pending',
 *     p_bid_amount
 *   )
 *   RETURNING id INTO v_bid_id;
 *
 *   INSERT INTO public.wallet_ledger(user_id, amount, reason, ref_id)
 *   VALUES (v_user, -p_bid_amount, 'bid_hold', v_bid_id);
 *
 *   RETURN v_bid_id;
 * END;
 * $$;
 *
 * GRANT EXECUTE ON FUNCTION public.place_bid(
 *   text, integer, text, text, text, text, text, text
 * ) TO authenticated;
 */
--
-- RLS(Row Level Security) 활성화
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--
-- 본인 데이터만 조회/수정 가능
-- CREATE POLICY "Users can view own data" ON public.users
--   FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own data" ON public.users
--   FOR UPDATE USING (auth.uid() = id);
--
-- auth.users 신규 가입 시 public.users에 자동 생성 트리거
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.users (id)
--   VALUES (NEW.id);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
