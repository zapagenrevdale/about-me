import { type ScryptOptions, scrypt, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import {
  createDiarySessionToken,
  DIARY_SESSION_COOKIE,
  getDiarySessionCookieOptions,
  getExpiredDiarySessionCookieOptions,
  verifyDiarySessionToken,
} from "@/lib/diary-session";

const HASH_PREFIX = "scrypt:v1";
const MAX_PASSWORD_LENGTH = 256;

const DEFAULT_SCRYPT_PARAMS = {
  N: 16_384,
  r: 8,
  p: 1,
  keyLength: 64,
} as const;

type ParsedPasswordHash = {
  params: typeof DEFAULT_SCRYPT_PARAMS;
  salt: Buffer;
  hash: Buffer;
};

export async function requireDiaryAuth() {
  if (await hasDiaryAuth()) {
    return;
  }

  throw new Error("Unauthorized diary access.");
}

export async function hasDiaryAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(DIARY_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return false;
  }

  return verifyDiarySessionToken(sessionToken);
}

export async function verifyDiaryPassword(password: string) {
  if (password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  const parsedHash = parsePasswordHash(process.env.DIARY_PASSWORD_HASH);

  if (!parsedHash) {
    return false;
  }

  const derivedHash = await deriveScryptHash(password, parsedHash.salt, {
    N: parsedHash.params.N,
    r: parsedHash.params.r,
    p: parsedHash.params.p,
    keyLength: parsedHash.params.keyLength,
  });

  return (
    derivedHash.length === parsedHash.hash.length &&
    timingSafeEqual(derivedHash, parsedHash.hash)
  );
}

export async function setDiarySessionCookie() {
  const token = await createDiarySessionToken();
  const cookieStore = await cookies();
  cookieStore.set(DIARY_SESSION_COOKIE, token, getDiarySessionCookieOptions());
}

export async function clearDiarySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(
    DIARY_SESSION_COOKIE,
    "",
    getExpiredDiarySessionCookieOptions()
  );
}

function parsePasswordHash(
  value: string | undefined
): ParsedPasswordHash | null {
  if (!value) {
    return null;
  }

  const [scheme, version, paramsValue, saltValue, hashValue, extra] =
    value.split(":");

  if (
    `${scheme}:${version}` !== HASH_PREFIX ||
    extra !== undefined ||
    !paramsValue ||
    !saltValue ||
    !hashValue
  ) {
    return null;
  }

  const params = parseScryptParams(paramsValue);

  if (!params) {
    return null;
  }

  try {
    return {
      params,
      salt: Buffer.from(saltValue, "base64url"),
      hash: Buffer.from(hashValue, "base64url"),
    };
  } catch {
    return null;
  }
}

function parseScryptParams(value: string): typeof DEFAULT_SCRYPT_PARAMS | null {
  const params = Object.fromEntries(
    value.split(",").map((part) => {
      const [key, rawValue] = part.split("=");
      return [key, Number(rawValue)];
    })
  );

  if (
    params.N !== DEFAULT_SCRYPT_PARAMS.N ||
    params.r !== DEFAULT_SCRYPT_PARAMS.r ||
    params.p !== DEFAULT_SCRYPT_PARAMS.p ||
    params.l !== DEFAULT_SCRYPT_PARAMS.keyLength
  ) {
    return null;
  }

  return DEFAULT_SCRYPT_PARAMS;
}

async function deriveScryptHash(
  password: string,
  salt: Buffer,
  params: typeof DEFAULT_SCRYPT_PARAMS
) {
  return await scryptBuffer(password, salt, params.keyLength, {
    N: params.N,
    maxmem: 64 * 1024 * 1024,
    p: params.p,
    r: params.r,
  });
}

function scryptBuffer(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}
