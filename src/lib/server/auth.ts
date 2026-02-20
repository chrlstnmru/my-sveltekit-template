import * as argon2 from 'argon2';

import { DEFAULT_SESSION_POLICY_CONFIG } from '$lib/const';

import type { MFAMethod } from './db/types';
import type { SessionTokens } from './session';

import { db } from './db';
import { createSession } from './session';

export type AuthContext = {
  ipAddress: string | undefined | null;
  userAgent: string | undefined | null;
};

export type LoginResult =
  | { status: 'ok'; tokens: SessionTokens }
  | { status: 'mfa_required'; mfaToken: string; availableMethods: MFAMethod[] };

export async function login(
  organizationSlug: string,
  email: string,
  password: string,
  ctx: AuthContext,
  opts?: { deviceId?: string; deviceName?: string; rememberMe?: boolean }
): Promise<LoginResult> {
  const org = await db.query.systemOrganizationsTable.findFirst({
    where: {
      AND: [{ slug: { eq: organizationSlug } }, { deletedAt: { isNull: true } }],
    },
    with: {
      config: true,
    },
  });

  if (!org) throw new AuthError('ORG_NOT_FOUND', 'Organization not fount');

  const user = await db.query.systemUsersTable.findFirst({
    where: {
      AND: [
        { organizationId: { eq: org.id } },
        { email: { eq: email } },
        { deletedAt: { isNull: true } },
      ],
    },
  });

  if (!user || !user.password) {
    // TODO: Record login attempt
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // TODO: Implement account lockout check

  const validPassword = await argon2.verify(user.password, password);
  if (!validPassword) {
    // TODO: Record login attempt
    // TODO: Implement failed login attempts
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // TODO: Implement MFA check

  const tokens = await createSession(
    user.id,
    org.config?.sessionPolicyConfig ?? DEFAULT_SESSION_POLICY_CONFIG,
    ctx,
    opts
  );

  // TODO: Record login attempt
  // TODO: Implement failed login attempts
  return { status: 'ok', tokens };
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
