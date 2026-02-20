import crypto from 'node:crypto';

import { DEFAULT_SESSION_POLICY_CONFIG } from '$lib/const';

import type { AuthContext } from './auth';
import type { SessionPolicyConfig } from './db/types';

import { db } from './db';
import { systemUserSessionsTable } from './db/schema';

const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};

export async function createSession(
  userId: string,
  config: Partial<SessionPolicyConfig>,
  ctx: AuthContext,
  opts?: { deviceId?: string; deviceName?: string; rememberMe?: boolean }
): Promise<SessionTokens> {
  const sessionConfig = { ...DEFAULT_SESSION_POLICY_CONFIG, ...config };

  // TODO: Implement single device session

  const absoluteTimeoutMs =
    opts?.rememberMe && sessionConfig.enableRememberMe
      ? sessionConfig.rememberMeAbsoluteTimeoutDays * 24 * 60 * 60 * 1000
      : sessionConfig.sessionAbsoluteTimeoutMinutes * 60 * 1000;

  const now = new Date();
  const accessToken = generateToken();
  const refreshToken = generateToken();
  const accessTokenExpiresAt = new Date(now.getTime() + ACCESS_TOKEN_LIFETIME_MS);
  const refreshTokenExpiresAt = new Date(now.getTime() + absoluteTimeoutMs);

  await db.insert(systemUserSessionsTable).values({
    userId,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    accessToken: hashToken(accessToken),
    refreshToken: hashToken(refreshToken),
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    lastActivityAt: now
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt
  };
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
