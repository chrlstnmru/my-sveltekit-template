import { hash, verify } from 'argon2';
import { createHash } from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
  try {
    return await verify(hashedPassword, password);
  } catch {
    return false;
  }
}

export function generateToken(bytes: number = 32): string {
  return createHash('sha256')
    .update(crypto.getRandomValues(new Uint8Array(bytes)))
    .digest('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyToken(hashedToken: string, token: string): boolean {
  return hashedToken === hashToken(token);
}

export function generateCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = createHash('sha256')
      .update(crypto.getRandomValues(new Uint8Array(4)))
      .digest('hex')
      .toUpperCase()
      .slice(0, 4);
    const part2 = createHash('sha256')
      .update(crypto.getRandomValues(new Uint8Array(4)))
      .digest('hex')
      .toUpperCase()
      .slice(0, 4);
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}
