import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client (service_role)
 * 웹훅, 백그라운드 작업 등 서버 전용. 절대 클라이언트에 노출 금지.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations"
    );
  }

  return createClient(url, key);
}
