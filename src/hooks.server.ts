import { sequence } from '@sveltejs/kit/hooks';

import { authHandle } from '$lib/server/auth/middleware';

export const handle = sequence(authHandle);
