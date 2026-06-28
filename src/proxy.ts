import { type NextRequest, NextResponse } from "next/server";

import {
  createDiarySessionToken,
  DIARY_SESSION_COOKIE,
  getDiarySessionCookieOptions,
  getExpiredDiarySessionCookieOptions,
  verifyDiarySessionToken,
} from "@/lib/diary-session";

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(DIARY_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  if (!(await verifyDiarySessionToken(sessionToken))) {
    response.cookies.set(
      DIARY_SESSION_COOKIE,
      "",
      getExpiredDiarySessionCookieOptions()
    );
    return response;
  }

  response.cookies.set(
    DIARY_SESSION_COOKIE,
    await createDiarySessionToken(),
    getDiarySessionCookieOptions()
  );

  return response;
}

export const config = {
  matcher: ["/diary", "/diary/:path*"],
};
