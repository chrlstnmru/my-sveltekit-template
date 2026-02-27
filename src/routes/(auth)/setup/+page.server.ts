import { redirect } from '@sveltejs/kit';

import { db } from '$lib/server/db';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const setup = await db.query.systemSetupTable.findFirst();

  if (setup?.completedAt) {
    redirect(303, '/admin/login');
  }

  return {};
};
