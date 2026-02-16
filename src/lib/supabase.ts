/**
 * Supabase 클라이언트 진입점
 *
 * - 브라우저(Client Component): createClient from '@/src/lib/supabase/client'
 * - 서버(Server Component): createClient from '@/src/lib/supabase/server'
 */

export { createClient as createBrowserClient } from "./supabase/client";
export { createClient as createServerClient } from "./supabase/server";
