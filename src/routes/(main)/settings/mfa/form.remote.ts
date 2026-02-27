import { fail } from '@sveltejs/kit';

import { form, getRequestEvent } from '$app/server';
import { authService } from '$lib/server/auth';

import { MfaSetupSchema, MfaSetupVerifySchema } from './schemas';

export const remoteMfaSetupForm = form(MfaSetupSchema, async (data) => {
  const { locals } = getRequestEvent();

  if (!locals.user) {
    return fail(401, { message: 'Unauthorized' });
  }

  const result = await authService.setupMfa(locals.user.id, data.method as 'totp' | 'email');

  if (!result.success) {
    return fail(400, { message: result.error || 'Failed to setup MFA' });
  }

  return {
    success: true,
    secret: result.secret,
    backupCodes: result.backupCodes
  };
});

export const remoteMfaVerifySetupForm = form(MfaSetupVerifySchema, async (data) => {
  const { locals } = getRequestEvent();

  if (!locals.user) {
    return fail(401, { message: 'Unauthorized' });
  }

  const result = await authService.verifyMfaSetup(locals.user.id, data.code);

  if (!result.success) {
    return fail(400, { message: result.error || 'Failed to verify MFA setup' });
  }

  return { success: true };
});
