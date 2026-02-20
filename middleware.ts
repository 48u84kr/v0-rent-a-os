import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-dark-32x32.png|icon-light-32x32.png|apple-icon.png|images/|placeholder|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
