import { redirect } from '@sveltejs/kit';

import { authService, clearAuthCookies } from '$lib/server/auth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { cookies, locals } = event;

  const accessToken = cookies.get('access_token');

  if (accessToken) {
    await authService.logout(accessToken);
  }

  clearAuthCookies(cookies);

  locals.user = null;
  locals.session = null;

  return redirect(303, '/login');
};
