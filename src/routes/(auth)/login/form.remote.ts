import { invalid, redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { form, getRequestEvent } from '$app/server';
import { ACCESS_TOKEN_TIMEOUT_MINUTES, authService } from '$lib/server/auth';
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

  if (!result.success) {
    // NOTE: Not yet implemented in remote function form
    // return invalid(issue.email('Invalid credentials'));
    return invalid(result.error ?? 'Invalid credentials');
  }

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
    cookies.set('access_token', result.accessToken, {
      path: '/',
      httpOnly: true,
      secure: !dev,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_TIMEOUT_MINUTES
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
