import { jwtVerify, SignJWT } from "jose";

export const DIARY_SESSION_COOKIE = "diary_session";
export const DIARY_SESSION_MAX_AGE_SECONDS = 10 * 60;

const SESSION_ISSUER = "about-me";
const SESSION_AUDIENCE = "diary";
const SESSION_SUBJECT = "owner";

export async function createDiarySessionToken() {
  return await new SignJWT({ scope: "diary" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${DIARY_SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifyDiarySessionToken(token: string) {
  try {
    await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
      audience: SESSION_AUDIENCE,
      issuer: SESSION_ISSUER,
      subject: SESSION_SUBJECT,
    });

    return true;
  } catch {
    return false;
  }
}

export function getDiarySessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: DIARY_SESSION_MAX_AGE_SECONDS,
    path: "/diary",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getExpiredDiarySessionCookieOptions() {
  return {
    ...getDiarySessionCookieOptions(),
    maxAge: 0,
  };
}

function getSessionSecret() {
  const secret = process.env.DIARY_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("DIARY_SESSION_SECRET must be at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}
