import { randomBytes, scrypt } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const params = {
  N: 16_384,
  r: 8,
  p: 1,
  keyLength: 64,
};

const rl = createInterface({ input, output });

try {
  const password = await rl.question("Diary password: ");

  if (!password) {
    throw new Error("Password cannot be empty.");
  }

  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, params.keyLength, {
    N: params.N,
    maxmem: 64 * 1024 * 1024,
    p: params.p,
    r: params.r,
  });

  const paramsValue = `N=${params.N},r=${params.r},p=${params.p},l=${params.keyLength}`;
  console.log(
    `DIARY_PASSWORD_HASH=scrypt:v1:${paramsValue}:${salt.toString(
      "base64url"
    )}:${hash.toString("base64url")}`
  );
} finally {
  rl.close();
}
