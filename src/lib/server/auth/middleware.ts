import type { Handle, RequestEvent } from '@sveltejs/kit';

import { redirect } from '@sveltejs/kit';

import type { RevokeReason } from '$lib/server/db/types';

import { authService, clearAuthCookies, getAuthCookies, setAuthCookies } from '.';

const PUBLIC_PATHS = ['/login', '/setup', '/api'];
const MFA_PATHS = ['/login/mfa'];

type AuthResult =
  | {
      status: 'authenticated';
      user: App.Locals['user'];
      session: App.Locals['session'];
      isFresh: boolean;
    }
  | { status: 'unauthenticated'; reason: RevokeReason };

async function checkAuth(event: RequestEvent): Promise<AuthResult> {
  const { cookies } = event;

  const { accessToken, refreshToken } = getAuthCookies(cookies);

  if (!accessToken) {
    return { status: 'unauthenticated', reason: 'expired' };
  }

  const validation = await authService.validateSession(accessToken);
  if (validation.success) {
    return {
      status: 'authenticated',
      user: validation.user,
      session: validation.session,
      isFresh: false
    };
  }

  if (!refreshToken) {
    return { status: 'unauthenticated', reason: 'expired' };
  }

  const newTokens = await authService.refreshTokens(refreshToken);
  if (!newTokens.success) {
    await authService.revokeTokens(accessToken, refreshToken, 'expired');
    return { status: 'unauthenticated', reason: 'expired' };
  }

  const newValidation = await authService.validateSession(newTokens.accessToken);
  if (!newValidation.success) {
    await authService.revokeTokens(accessToken, refreshToken, 'expired');
    return { status: 'unauthenticated', reason: 'expired' };
  }

  const accessTokenMaxAge = newTokens.accessTokenExpiresAt.getTime() / 1000;
  const refreshTokenMaxAge = newTokens.refreshTokenExpiresAt.getTime() / 1000;
  setAuthCookies(cookies, {
    accessToken: newTokens.accessToken,
    accessTokenMaxAge,
    refreshToken: newTokens.refreshToken,
    refreshTokenMaxAge
  });

  return {
    status: 'authenticated',
    user: newValidation.user,
    session: newValidation.session,
    isFresh: true
  };
}

/** Authentication middleware */
export const authHandle: Handle = async ({ event, resolve }) => {
  const { url, request, locals, cookies } = event;
  const path = url.pathname;

  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isMfaPath = MFA_PATHS.some((p) => path.startsWith(p));
  const isRemoteFunctionForm = request.headers
    .get('content-type')
    ?.includes('application/x-sveltekit-formdata');

  const authResult = await checkAuth(event);

  if (authResult.status === 'authenticated') {
    locals.user = authResult.user;
    locals.session = authResult.session;

    if (isPublicPath && !isMfaPath) {
      return isRemoteFunctionForm ? resolve(event) : redirect(303, '/');
    }
  } else {
    if (authResult.reason === 'expired') {
      clearAuthCookies(cookies);
    }

    if (!isPublicPath) {
      return isRemoteFunctionForm ? resolve(event) : redirect(303, '/login');
    }
  }

  return resolve(event);
};
