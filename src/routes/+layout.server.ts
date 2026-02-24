import { redirect } from '@sveltejs/kit';

import { db } from '$lib/server/db';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals }) => {
  const setup = await db.query.systemSetupTable.findFirst();
  const isSetupComplete = !!setup?.completedAt;

  const isSetupPage = url.pathname.startsWith('/setup');

  if (!isSetupComplete && !isSetupPage) {
    redirect(303, '/setup');
  }

  return {
    isSetupComplete,
    user: locals.user,
    session: locals.session
  };
};
