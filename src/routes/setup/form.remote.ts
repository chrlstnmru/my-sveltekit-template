import { form } from '$app/server';
import { SetupSchema } from '$lib/validators';

export const remoteSetupForm = form(SetupSchema, async () => {});
