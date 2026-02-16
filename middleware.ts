import { type NextRequest } from "next/server";
import { updateSession } from "@/src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/subscribe/:path*",
    "/charge/:path*",
    "/my/:path*",
    "/settings/:path*",
    "/new/:path*",
  ],
};
