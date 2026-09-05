/**
 * Client-only PIN hashing (Web Crypto `SubtleCrypto` — no dependency). Salted SHA-256 is
 * appropriate here because the PIN is a privacy shield, not the account's security
 * boundary (see `schema.ts`'s doc comment) — there is no server-side brute-force surface
 * to defend against beyond the client-tracked lockout in `recovery-lock-repository.ts`.
 */

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${pin}`);
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const actual = await hashPin(pin, salt);
  return actual === expectedHash;
}
