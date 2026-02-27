import { fail, redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { form, getRequestEvent } from '$app/server';
import { authService } from '$lib/server/auth';
import { MfaVerifySchema } from '$lib/validators';

export const remoteMfaForm = form(MfaVerifySchema, async (data) => {
  const { request, cookies } = getRequestEvent();

  const challengeId = cookies.get('mfa_challenge_id');

  if (!challengeId) {
    redirect(303, '/login');
  }

  const clientAddress =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent') || null;

  const result = await authService.verifyMfa(challengeId, data.code, clientAddress, userAgent);

  if (!result.success) {
    return fail(400, { message: result.error || 'MFA verification failed' });
  }

  cookies.delete('mfa_challenge_id', { path: '/' });

  if (result.accessToken && result.refreshToken) {
    cookies.set('access_token', result.accessToken, {
      path: '/',
      httpOnly: true,
      secure: !dev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8
    });

    cookies.set('refresh_token', result.refreshToken, {
      path: '/',
      httpOnly: true,
      secure: !dev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });
  }

  redirect(303, '/');
});
