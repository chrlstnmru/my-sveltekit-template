import { and, eq, isNull } from 'drizzle-orm';
import * as v from 'valibot';

import type { systemEmployeesTable } from '$lib/server/db/schema';
import type { RevokeReason, SessionPolicyConfig } from '$lib/server/db/types';

import { DEFAULT_SESSION_POLICY_CONFIG } from '$lib/constants/policies';
import { db } from '$lib/server/db';
import {
  systemUserMfaBackupCodesTable,
  systemUserMfaChallengesTable,
  systemUserMfaTable,
  systemUserSessionsTable,
  systemUsersTable
} from '$lib/server/db/schema';
import { SessionPolicySchema } from '$lib/validators';

import {
  generateBackupCodes,
  generateCode,
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
  verifyToken
} from './crypto';

type UserExtraInfo = Pick<typeof systemEmployeesTable.$inferSelect, 'firstName' | 'lastName'>;
export type User = Omit<typeof systemUsersTable.$inferSelect, 'password'> & {
  employeeData?: UserExtraInfo | null;
};
export type Session = typeof systemUserSessionsTable.$inferSelect;

type Never<T extends object> = {
  [K in keyof T]?: never;
};

type SuccessResult<T> = {
  success: true;
} & T;

// eslint-disable-next-line ts/no-empty-object-type
type FailureResult<T extends Record<string, unknown> = {}> = {
  success: false;
  error: string;
} & T;

type Tokens = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

type MfaRequied = { requiresMfa: true; mfaChallengeId: string };

type LoginResult =
  | SuccessResult<MfaRequied & Never<Tokens>>
  | SuccessResult<Tokens & Never<MfaRequied>>
  | FailureResult;

export class AuthService {
  private getOrganizationSettings = async (organizationId: string) => {
    const settings = await db.query.systemOrganizationSettingsTable.findFirst({
      where: { organizationId }
    });
    return settings;
  };

  private revokeOtherSessions = async (userId: string, reason: RevokeReason) => {
    await db
      .update(systemUserSessionsTable)
      .set({ revokedAt: new Date(), revokeReason: reason })
      .where(
        and(eq(systemUserSessionsTable.userId, userId), isNull(systemUserSessionsTable.revokedAt))
      );
  };

  private generateSessionTokens = (
    accessTokenTimeoutMs: number,
    refreshTokenTimeoutMs: number,
    now?: Date
  ) => {
    const dateNow = now ?? new Date();

    const accessToken = generateToken(32);
    const accessTokenHash = hashToken(accessToken);
    const accessTokenExpiresAt = new Date(dateNow.getTime() + accessTokenTimeoutMs);

    const refreshToken = generateToken(32);
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiresAt = new Date(dateNow.getTime() + refreshTokenTimeoutMs);

    return {
      now: dateNow,
      accessToken,
      accessTokenHash,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt
    };
  };

  private createSession = async (
    userId: string,
    ipAddress: string | null,
    userAgent: string | null,
    rememberMe: boolean = false
  ): Promise<Tokens> => {
    const user = await db.query.systemUsersTable.findFirst({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const sessionPolicy = await this.getSessionPolicy(user.organizationId);

    if (sessionPolicy.maxConcurrentSessions === 1) {
      await this.revokeOtherSessions(userId, 'session_limit_exceeded');
    }

    const accessTokenTimeoutMs = sessionPolicy.accessTokenLifetimeMinutes * 60 * 1000;
    const refreshTokenTimeoutMs = sessionPolicy.refreshTokenLifetimeMinutes * 60 * 1000;
    const refreshTokenAbsoluteExpiresAt = rememberMe
      ? new Date(Date.now() + sessionPolicy.rememberMeDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + refreshTokenTimeoutMs);

    const {
      now,
      accessToken,
      accessTokenHash,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt
    } = this.generateSessionTokens(accessTokenTimeoutMs, refreshTokenTimeoutMs);

    await db
      .insert(systemUserSessionsTable)
      .values({
        userId,
        ipAddress,
        userAgent,
        accessToken: accessTokenHash,
        accessTokenExpiresAt,
        refreshToken: refreshTokenHash,
        refreshTokenExpiresAt,
        refreshTokenAbsoluteExpiresAt,
        lastActivityAt: now
      })
      .returning();

    return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
  };

  revokeTokens = async (accessToken: string, refreshToken: string, reason: RevokeReason) => {
    await db
      .update(systemUserSessionsTable)
      .set({ revokedAt: new Date(), revokeReason: reason })
      .where(
        and(
          eq(systemUserSessionsTable.accessToken, accessToken),
          eq(systemUserSessionsTable.refreshToken, refreshToken)
        )
      );
  };

  getSessionPolicy = async (organizationId: string): Promise<SessionPolicyConfig> => {
    const settings = await this.getOrganizationSettings(organizationId);
    if (!settings?.sessionPolicyConfig) {
      return DEFAULT_SESSION_POLICY_CONFIG;
    }

    const sessionPolicyParser = v.safeParser(SessionPolicySchema);
    const sessionPolicy = sessionPolicyParser(settings.sessionPolicyConfig);

    if (!sessionPolicy.success) {
      console.warn('Failed to parse session policy: ', v.flatten(sessionPolicy.issues));
      return DEFAULT_SESSION_POLICY_CONFIG;
    }

    return sessionPolicy.output as SessionPolicyConfig;
  };

  validateCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    const users = await db
      .select()
      .from(systemUsersTable)
      .where(and(eq(systemUsersTable.email, email), isNull(systemUsersTable.deletedAt))!);

    const user = users[0];

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return { success: false, error: 'Account is temporarily locked' };
    }

    if (!user.password) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValid = await verifyPassword(user.password, password);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    return { success: true, user };
  };

  login = async (
    email: string,
    password: string,
    ipAddress: string | null,
    userAgent: string | null,
    rememberMe: boolean = false
  ): Promise<LoginResult> => {
    const validation = await this.validateCredentials(email, password);
    if (!validation.success || !validation.user) {
      return { success: false, error: validation.error ?? 'Invalid credentials' };
    }

    const user = validation.user;

    const userMfa = await db.query.systemUserMfaTable.findFirst({
      where: { userId: user.id }
    });

    if (userMfa?.enabled) {
      const challengeCode = generateCode(6);
      const challengeCodeHash = hashToken(challengeCode);

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const [challenge] = await db
        .insert(systemUserMfaChallengesTable)
        .values({
          userId: user.id,
          method: userMfa.method,
          codeHash: challengeCodeHash,
          expiresAt
        })
        .returning();

      return {
        success: true,
        requiresMfa: true,
        mfaChallengeId: challenge.id
      };
    }

    const tokens = await this.createSession(user.id, ipAddress, userAgent, rememberMe);

    await db
      .update(systemUsersTable)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(systemUsersTable.id, user.id));

    return {
      success: true,
      ...tokens
    };
  };

  verifyMfa = async (
    challengeId: string,
    code: string,
    ipAddress: string | null,
    userAgent: string | null,
    rememberMe: boolean = false
  ): Promise<SuccessResult<Tokens> | FailureResult> => {
    const challenge = await db.query.systemUserMfaChallengesTable.findFirst({
      where: { id: challengeId }
    });

    if (!challenge) {
      return { success: false, error: 'Invalid challenge' };
    }

    if (challenge.verifiedAt) {
      return { success: false, error: 'Challenge already used' };
    }

    if (new Date() > challenge.expiresAt) {
      return { success: false, error: 'Challenge expired' };
    }

    if (challenge.attempts >= 5) {
      return { success: false, error: 'Too many attempts' };
    }

    const isValid = verifyToken(challenge.codeHash!, code);
    if (!isValid) {
      await db
        .update(systemUserMfaChallengesTable)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(systemUserMfaChallengesTable.id, challengeId));

      return { success: false, error: 'Invalid code' };
    }

    await db
      .update(systemUserMfaChallengesTable)
      .set({ verifiedAt: new Date() })
      .where(eq(systemUserMfaChallengesTable.id, challengeId));

    const tokens = await this.createSession(challenge.userId, ipAddress, userAgent, rememberMe);

    return {
      success: true,
      ...tokens
    };
  };

  logout = async (accessToken: string): Promise<{ success: boolean }> => {
    const accessTokenHash = hashToken(accessToken);

    await db
      .update(systemUserSessionsTable)
      .set({ revokedAt: new Date(), revokeReason: 'user_revoked' })
      .where(eq(systemUserSessionsTable.accessToken, accessTokenHash));

    return { success: true };
  };

  validateSession = async (
    accessToken: string
  ): Promise<SuccessResult<{ session: Session; user: User }> | FailureResult> => {
    const accessTokenHash = hashToken(accessToken);

    const session = await db.query.systemUserSessionsTable.findFirst({
      where: {
        accessToken: { eq: accessTokenHash }
      }
    });

    if (!session) {
      return { success: false, error: 'Invalid session' };
    }

    if (session.revokedAt) {
      return { success: false, error: session.revokeReason ?? 'revoked' };
    }

    if (new Date() > session.accessTokenExpiresAt) {
      return { success: false, error: 'Session expired' };
    }

    const user = await db.query.systemUsersTable.findFirst({
      columns: {
        password: false
      },
      with: {
        employeeData: {
          columns: {
            firstName: true,
            lastName: true
          }
        }
      },
      where: { id: session.userId }
    });

    if (!user || user.deletedAt) {
      await this.revokeTokens(session.accessToken, session.refreshToken, 'expired');
      return { success: false, error: 'User not found' };
    }

    await db
      .update(systemUserSessionsTable)
      .set({ lastActivityAt: new Date() })
      .where(eq(systemUserSessionsTable.id, session.id));

    return { success: true, session, user };
  };

  refreshTokens = async (refreshToken: string): Promise<SuccessResult<Tokens> | FailureResult> => {
    const refreshTokenHash = hashToken(refreshToken);

    const session = await db.query.systemUserSessionsTable.findFirst({
      where: {
        AND: [{ refreshToken: { eq: refreshTokenHash } }, { revokedAt: { isNull: true } }]
      }
    });

    if (!session) {
      return { success: false, error: 'Invalid refresh token' };
    }

    if (new Date() > session.refreshTokenExpiresAt) {
      await db
        .update(systemUserSessionsTable)
        .set({ revokedAt: new Date(), revokeReason: 'expired' })
        .where(eq(systemUserSessionsTable.id, session.id));
      return { success: false, error: 'Refresh token expired' };
    }

    const sessionPolicy = await this.getSessionPolicy(session.userId);

    const accessTokenTimeoutMs = sessionPolicy.accessTokenLifetimeMinutes * 60 * 1000;
    const refreshTokenTimeoutMs = sessionPolicy.refreshTokenLifetimeMinutes * 60 * 1000;

    const {
      accessToken,
      accessTokenHash,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
      refreshTokenHash: newRefreshTokenHash,
      refreshTokenExpiresAt: newRefreshTokenExpiresAt
    } = this.generateSessionTokens(accessTokenTimeoutMs, refreshTokenTimeoutMs);

    if (newRefreshTokenExpiresAt >= session.refreshTokenAbsoluteExpiresAt) {
      await this.revokeTokens(accessToken, refreshToken, 'expired');
      return { success: false, error: 'Refresh token expired' };
    }

    await db
      .update(systemUserSessionsTable)
      .set({
        accessToken: accessTokenHash,
        accessTokenExpiresAt,
        refreshToken: newRefreshTokenHash,
        refreshTokenExpiresAt: newRefreshTokenExpiresAt,
        lastActivityAt: new Date()
      })
      .where(eq(systemUserSessionsTable.id, session.id));

    return {
      success: true,
      accessToken,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: newRefreshTokenExpiresAt
    };
  };

  setupMfa = async (
    userId: string,
    method: 'totp' | 'email'
  ): Promise<{
    success: boolean;
    secret?: string;
    backupCodes?: string[];
    error?: string;
  }> => {
    const existingMfa = await db.query.systemUserMfaTable.findFirst({
      where: { userId }
    });

    if (existingMfa?.enabled) {
      return { success: false, error: 'MFA already enabled' };
    }

    const secret = generateToken(20);
    const backupCodes = generateBackupCodes(10);

    const backupCodeHashes = await Promise.all(backupCodes.map((code) => hashPassword(code)));

    if (existingMfa) {
      await db
        .update(systemUserMfaTable)
        .set({
          method,
          secret,
          enabled: false,
          verifiedAt: null
        })
        .where(eq(systemUserMfaTable.userId, userId));

      await db
        .delete(systemUserMfaBackupCodesTable)
        .where(eq(systemUserMfaBackupCodesTable.mfaId, existingMfa.id));
    } else {
      await db.insert(systemUserMfaTable).values({
        userId,
        method,
        secret,
        enabled: false
      });
    }

    const mfa = await db.query.systemUserMfaTable.findFirst({
      where: { userId }
    });

    if (mfa) {
      await db.insert(systemUserMfaBackupCodesTable).values(
        backupCodeHashes.map((hash) => ({
          mfaId: mfa.id,
          codeHash: hash
        }))
      );
    }

    return { success: true, secret, backupCodes };
  };

  verifyMfaSetup = async (
    userId: string,
    _code: string
  ): Promise<{ success: boolean; error?: string }> => {
    const mfa = await db.query.systemUserMfaTable.findFirst({
      where: { userId }
    });

    if (!mfa) {
      return { success: false, error: 'MFA not set up' };
    }

    if (mfa.enabled) {
      return { success: false, error: 'MFA already enabled' };
    }

    await db
      .update(systemUserMfaTable)
      .set({
        enabled: true,
        verifiedAt: new Date()
      })
      .where(eq(systemUserMfaTable.id, mfa.id));

    return { success: true };
  };

  disableMfa = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    const mfa = await db.query.systemUserMfaTable.findFirst({
      where: { userId }
    });

    if (!mfa) {
      return { success: false, error: 'MFA not set up' };
    }

    await db
      .delete(systemUserMfaBackupCodesTable)
      .where(eq(systemUserMfaBackupCodesTable.mfaId, mfa.id));

    await db.delete(systemUserMfaTable).where(eq(systemUserMfaTable.userId, userId));

    return { success: true };
  };
}

export const authService = new AuthService();
