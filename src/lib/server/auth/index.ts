import type { Cookies } from '@sveltejs/kit';

import { dev } from '$app/environment';
import {
  ACCESS_TOKEN_COOKIE,
  MFA_CHALLENGE_COOKIE,
  REFRESH_TOKEN_COOKIE
} from '$lib/constants/config';

export * from './crypto';
export * from './service';

type AuthCookies = {
  accessToken: string;
  accessTokenMaxAge: number;
  refreshToken: string;
  refreshTokenMaxAge: number;
};

export function getAuthCookies(cookies: Cookies) {
  return {
    accessToken: cookies.get(ACCESS_TOKEN_COOKIE),
    refreshToken: cookies.get(REFRESH_TOKEN_COOKIE)
  };
}

export function setAuthCookies(
  cookies: Cookies,
  { accessToken, accessTokenMaxAge, refreshToken, refreshTokenMaxAge }: AuthCookies
) {
  cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: accessTokenMaxAge
  });

  cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: refreshTokenMaxAge
  });
}

export function clearAuthCookies(cookies: Cookies) {
  cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
  cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/' });
}

export function getMfaChallenge(cookies: Cookies) {
  return cookies.get(MFA_CHALLENGE_COOKIE);
}

export function setMfaChallege(cookies: Cookies, challengeId: string) {
  cookies.set(MFA_CHALLENGE_COOKIE, challengeId, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: 600
  });
}

export function clearMfaChallenge(cookies: Cookies) {
  cookies.delete(MFA_CHALLENGE_COOKIE, { path: '/' });
}
