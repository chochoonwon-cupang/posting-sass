-- Supabase SQL Editor에서 실행하세요.
-- place_bid 함수 교체 및 권한 부여

CREATE OR REPLACE FUNCTION public.place_bid(
  p_keyword text,
  p_bid_amount integer,
  p_posting_method text,
  p_phone text,
  p_kakao text,
  p_insta text,
  p_address text,
  p_place_url text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_balance integer;
  v_bid_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_bid_amount < 70 THEN
    RAISE EXCEPTION 'min bid is 70';
  END IF;

  SELECT balance INTO v_balance
  FROM public.users
  WHERE id = v_user
  FOR UPDATE;

  IF v_balance < p_bid_amount THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  UPDATE public.users
    SET balance = balance - p_bid_amount
  WHERE id = v_user;

  INSERT INTO public.bids(
    user_id,
    keyword,
    bid_price,
    post_type,
    phone,
    kakao,
    instagram,
    address,
    place_url,
    status,
    held_amount
  )
  VALUES (
    v_user,
    p_keyword,
    p_bid_amount,
    p_posting_method,
    p_phone,
    p_kakao,
    p_insta,
    p_address,
    p_place_url,
    'pending',
    p_bid_amount
  )
  RETURNING id INTO v_bid_id;

  INSERT INTO public.wallet_ledger(user_id, amount, reason, ref_id)
  VALUES (v_user, -p_bid_amount, 'bid_hold', v_bid_id);

  RETURN v_bid_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_bid(
  text, integer, text, text, text, text, text, text
) TO authenticated;
