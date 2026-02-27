import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

import type { PasswordPolicyConfig, SessionPolicyConfig } from '$lib/server/db/types';

import { db } from '$lib/server/db';
import { systemOrganizationSettingsTable } from '$lib/server/db/schema';
import { PasswordPolicySchema, SessionPolicySchema } from '$lib/validators';

import { withAuthForm, withAuthQuery } from './guards';

export const remoteGetOrganizationSettings = withAuthQuery(async () => {
  const settings = await db.query.systemOrganizationSettingsTable.findFirst();
  return settings;
});

export const remoteGetSessionPolicy = withAuthQuery(
  v.object({
    organizationId: v.nullish(v.string())
  }),
  async ({ organizationId }) => {
    if (!organizationId) {
      return error(400, 'Organization ID is required');
    }

    const policy = await db.query.systemOrganizationSettingsTable.findFirst({
      columns: {
        sessionPolicyConfig: true
      },
      where: {
        organizationId
      }
    });

    if (!policy) {
      throw new Error('Session policy not found');
    }

    return policy.sessionPolicyConfig as Required<SessionPolicyConfig>;
  }
);

export const remoteGetPasswordPolicy = withAuthQuery(
  v.object({
    organizationId: v.nullish(v.string())
  }),
  async ({ organizationId }) => {
    if (!organizationId) {
      return error(400, 'Organization ID is required');
    }

    const policy = await db.query.systemOrganizationSettingsTable.findFirst({
      columns: {
        passwordPolicyConfig: true
      },
      where: {
        organizationId
      }
    });

    if (!policy) {
      throw new Error('Password policy not found');
    }

    return policy.passwordPolicyConfig as Required<PasswordPolicyConfig>;
  }
);

export const remoteUpdatePasswordPolicy = withAuthForm(PasswordPolicySchema, async (data, ctx) => {
  const [policy] = await db
    .update(systemOrganizationSettingsTable)
    .set({
      passwordPolicyConfig: { ...data, requirements: { ...data.requirements } }
    })
    .where(eq(systemOrganizationSettingsTable.organizationId, ctx.auth.user.organizationId))
    .returning({ passwordPolicyConfig: systemOrganizationSettingsTable.passwordPolicyConfig });

  if (!policy) {
    return ctx.invalid('Failed to update password policy');
  }

  return policy.passwordPolicyConfig as Required<PasswordPolicyConfig>;
});

export const remoteUpdateSessionPolicy = withAuthForm(SessionPolicySchema, async (data, ctx) => {
  const [policy] = await db
    .update(systemOrganizationSettingsTable)
    .set({
      sessionPolicyConfig: data
    })
    .where(eq(systemOrganizationSettingsTable.organizationId, ctx.auth.user.organizationId))
    .returning({ sessionPolicyConfig: systemOrganizationSettingsTable.sessionPolicyConfig });

  if (!policy) {
    return ctx.invalid('Failed to update session policy');
  }

  return policy.sessionPolicyConfig as Required<SessionPolicyConfig>;
});
