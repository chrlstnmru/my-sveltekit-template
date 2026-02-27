import { and, eq, isNull } from 'drizzle-orm';

import type { systemEmployeesTable } from '$lib/server/db/schema';
import type { RevokeReason, SessionPolicyConfig } from '$lib/server/db/types';

import { DEFAULT_SESSION_POLICY_CONFIG } from '$lib/const';
import { db } from '$lib/server/db';
import {
  systemUserMfaBackupCodesTable,
  systemUserMfaChallengesTable,
  systemUserMfaTable,
  systemUserSessionsTable,
  systemUsersTable
} from '$lib/server/db/schema';

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

type RefreshTokensSuccess = {
  success: true;
  accessToken: string;
  refreshToken: string;
};

type RefreshTokensFailure = {
  success: false;
  error: string;
};

type RefreshTokensResult = RefreshTokensSuccess | RefreshTokensFailure;

type ValidateSessionSuccess = {
  valid: true;
  session: Session;
  user: User;
};

type ValidateSessionFailure = {
  valid: false;
  error: string;
};

type ValidateSessionResult = ValidateSessionSuccess | ValidateSessionFailure;

/** @default 8 hours */
export const ACCESS_TOKEN_TIMEOUT_MINUTES = 60 * 60 * 8;

export class AuthService {
  private getOrganizationSettings = async (organizationId: string) => {
    const settings = await db.query.systemOrganizationSettingsTable.findFirst({
      where: { organizationId }
    });
    return settings;
  };

  private getSessionPolicy = async (organizationId: string): Promise<SessionPolicyConfig> => {
    const settings = await this.getOrganizationSettings(organizationId);
    if (!settings?.sessionPolicyConfig) {
      return DEFAULT_SESSION_POLICY_CONFIG;
    }
    return settings.sessionPolicyConfig as SessionPolicyConfig;
  };

  private revokeOtherSessions = async (userId: string, reason: RevokeReason) => {
    await db
      .update(systemUserSessionsTable)
      .set({ revokedAt: new Date(), revokeReason: reason })
      .where(
        and(eq(systemUserSessionsTable.userId, userId), isNull(systemUserSessionsTable.revokedAt))
      );
  };

  private createSession = async (
    userId: string,
    ipAddress: string | null,
    userAgent: string | null,
    rememberMe: boolean = false
  ): Promise<{ session: Session; accessToken: string; refreshToken: string }> => {
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

    const accessToken = generateToken(32);
    const refreshToken = generateToken(32);

    const accessTokenHash = hashToken(accessToken);
    const refreshTokenHash = hashToken(refreshToken);

    const now = new Date();
    const accessTokenExpiresAt = new Date(
      now.getTime() + sessionPolicy.sessionAbsoluteTimeoutMinutes * 60 * 1000
    );

    let refreshTokenExpiresAt: Date;
    if (rememberMe) {
      refreshTokenExpiresAt = new Date(
        now.getTime() + sessionPolicy.rememberMeAbsoluteTimeoutDays * 24 * 60 * 60 * 1000
      );
    } else {
      refreshTokenExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const [session] = await db
      .insert(systemUserSessionsTable)
      .values({
        userId,
        ipAddress,
        userAgent,
        accessToken: accessTokenHash,
        accessTokenExpiresAt,
        refreshToken: refreshTokenHash,
        refreshTokenExpiresAt,
        lastActivityAt: now
      })
      .returning();

    return { session, accessToken, refreshToken };
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
  ): Promise<{
    success: boolean;
    requiresMfa?: boolean;
    session?: Session;
    accessToken?: string;
    refreshToken?: string;
    mfaChallengeId?: string;
    error?: string;
  }> => {
    const validation = await this.validateCredentials(email, password);
    if (!validation.success || !validation.user) {
      return { success: false, error: validation.error };
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

    const result = await this.createSession(user.id, ipAddress, userAgent, rememberMe);

    await db
      .update(systemUsersTable)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(systemUsersTable.id, user.id));

    return {
      success: true,
      requiresMfa: false,
      session: result.session,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    };
  };

  verifyMfa = async (
    challengeId: string,
    code: string,
    ipAddress: string | null,
    userAgent: string | null,
    rememberMe: boolean = false
  ): Promise<{
    success: boolean;
    session?: Session;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }> => {
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

    const result = await this.createSession(challenge.userId, ipAddress, userAgent, rememberMe);

    return {
      success: true,
      session: result.session,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
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

  validateSession = async (accessToken: string): Promise<ValidateSessionResult> => {
    const accessTokenHash = hashToken(accessToken);

    const session = await db.query.systemUserSessionsTable.findFirst({
      where: {
        accessToken: { eq: accessTokenHash }
      }
    });

    if (!session) {
      return { valid: false, error: 'Invalid session' };
    }

    if (session.revokedAt) {
      return { valid: false, error: session.revokeReason ?? 'revoked' };
    }

    if (new Date() > session.accessTokenExpiresAt) {
      await db
        .update(systemUserSessionsTable)
        .set({ revokedAt: new Date() })
        .where(eq(systemUserSessionsTable.id, session.id));
      return { valid: false, error: 'Session expired' };
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
      await db
        .update(systemUserSessionsTable)
        .set({ revokedAt: new Date() })
        .where(eq(systemUserSessionsTable.id, session.id));
      return { valid: false, error: 'User not found' };
    }

    await db
      .update(systemUserSessionsTable)
      .set({ lastActivityAt: new Date() })
      .where(eq(systemUserSessionsTable.id, session.id));

    return { valid: true, session, user };
  };

  refreshTokens = async (refreshToken: string): Promise<RefreshTokensResult> => {
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
        .set({ revokedAt: new Date() })
        .where(eq(systemUserSessionsTable.id, session.id));
      return { success: false, error: 'Refresh token expired' };
    }

    const accessToken = generateToken(32);
    const newRefreshToken = generateToken(32);

    const accessTokenHash = hashToken(accessToken);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const sessionPolicy = await this.getSessionPolicy(session.userId);

    const accessTokenExpiresAt = new Date(
      Date.now() + sessionPolicy.sessionAbsoluteTimeoutMinutes * 60 * 1000
    );
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(systemUserSessionsTable)
      .set({
        accessToken: accessTokenHash,
        accessTokenExpiresAt,
        refreshToken: newRefreshTokenHash,
        refreshTokenExpiresAt,
        lastActivityAt: new Date()
      })
      .where(eq(systemUserSessionsTable.id, session.id));

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken
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
