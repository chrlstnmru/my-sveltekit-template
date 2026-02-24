import type { Handle } from '@sveltejs/kit';

import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

import { dev } from '$app/environment';
import { authService } from '$lib/server/auth';

const PUBLIC_PATHS = ['/login', '/setup', '/api'];
const MFA_PATHS = ['/login/mfa'];

const SESSION_WARNING_MS = 10 * 60 * 1000;

function setAuthCookies(
  cookies: import('@sveltejs/kit').Cookies,
  accessToken: string,
  refreshToken: string
) {
  cookies.set('access_token', accessToken, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8
  });

  cookies.set('refresh_token', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });
}

export const authHandle: Handle = async ({ event, resolve }) => {
  const { cookies, url } = event;
  const path = url.pathname;

  const accessToken = cookies.get('access_token');
  const refreshToken = cookies.get('refresh_token');

  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isMfaPath = MFA_PATHS.some((p) => path.startsWith(p));

  if (accessToken) {
    const validation = await authService.validateSession(accessToken);

    if (validation.valid && validation.user && validation.session) {
      event.locals.user = validation.user;
      event.locals.session = validation.session;

      // Check if session is about to expire and refresh if necessary
      const expiresSoon =
        new Date(validation.session.accessTokenExpiresAt).getTime() - Date.now() <
        SESSION_WARNING_MS;

      if (expiresSoon && refreshToken) {
        const refreshResult = await authService.refreshTokens(refreshToken);
        if (refreshResult.success && refreshResult.accessToken && refreshResult.refreshToken) {
          setAuthCookies(cookies, refreshResult.accessToken, refreshResult.refreshToken);
        }
      }

      if (isPublicPath && !isMfaPath) {
        redirect(303, '/');
      }
    } else if (refreshToken) {
      const refreshResult = await authService.refreshTokens(refreshToken);

      if (refreshResult.success && refreshResult.accessToken && refreshResult.refreshToken) {
        const newValidation = await authService.validateSession(refreshResult.accessToken);

        if (newValidation.valid && newValidation.user && newValidation.session) {
          event.locals.user = newValidation.user;
          event.locals.session = newValidation.session;

          setAuthCookies(cookies, refreshResult.accessToken, refreshResult.refreshToken);

          if (isPublicPath && !isMfaPath) {
            redirect(303, '/');
          }

          return resolve(event);
        }
      }

      cookies.delete('access_token', { path: '/' });
      cookies.delete('refresh_token', { path: '/' });

      if (!isPublicPath) {
        redirect(303, '/login');
      }
    } else {
      cookies.delete('access_token', { path: '/' });

      if (!isPublicPath) {
        redirect(303, '/login');
      }
    }
  } else if (!isPublicPath) {
    redirect(303, '/login');
  }

  return resolve(event);
};

export const handle = sequence(authHandle);
