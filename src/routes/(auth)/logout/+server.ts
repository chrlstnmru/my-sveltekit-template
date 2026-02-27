import { redirect } from '@sveltejs/kit';

import { authService } from '$lib/server/auth';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  const { cookies, locals } = event;

  const accessToken = cookies.get('access_token');

  if (accessToken) {
    await authService.logout(accessToken);
  }

  cookies.delete('access_token', { path: '/' });
  cookies.delete('refresh_token', { path: '/' });
  cookies.delete('mfa_challenge_id', { path: '/' });

  locals.user = null;
  locals.session = null;

  return redirect(303, '/login');
};
