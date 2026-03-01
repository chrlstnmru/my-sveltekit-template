import { invalid, redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { form, getRequestEvent } from '$app/server';
import { authService } from '$lib/server/auth';
import { LoginSchema } from '$lib/validators';

export const remoteLoginForm = form(LoginSchema, async (data) => {
  const { request, cookies, getClientAddress } = getRequestEvent();

  const clientAddress = getClientAddress();
  const userAgent = request.headers.get('user-agent') || null;

  const result = await authService.login(
    data.email,
    data.password,
    clientAddress,
    userAgent,
    data.rememberMe
  );

  if (result.success) {
    if (result.requiresMfa && result.mfaChallengeId) {
      cookies.set('mfa_challenge_id', result.mfaChallengeId, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: 600
      });

      redirect(303, '/login/mfa');
    }

    if (result.accessToken && result.refreshToken) {
      const accessTokenMaxAge = result.accessTokenExpiresAt.getTime() / 1000;
      const refreshTokenMaxAge = result.refreshTokenExpiresAt.getTime() / 1000;

      cookies.set('access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: accessTokenMaxAge
      });

      cookies.set('refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: refreshTokenMaxAge
      });
    }
  } else {
    // NOTE: Not yet implemented in remote function form
    // return invalid(issue.email('Invalid credentials'));
    return invalid(result.error ?? 'Invalid credentials');
  }

  redirect(303, '/');
});
