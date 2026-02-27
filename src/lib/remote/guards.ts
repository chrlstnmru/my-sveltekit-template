import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { RemoteFormInput } from '@sveltejs/kit';

import { error } from '@sveltejs/kit';

import { command, form, getRequestEvent, query } from '$app/server';

type User = NonNullable<App.Locals['user']>;
type Session = NonNullable<App.Locals['session']>;

type AuthContext = {
  user: User;
  session: Session;
};

function getAuthContext(): AuthContext {
  const { locals } = getRequestEvent();

  if (!locals.user || !locals.session) {
    error(401, 'Unauthorized');
  }

  return {
    user: locals.user,
    session: locals.session
  };
}

export function withAuthQuery<Output>(
  fn: (auth: AuthContext) => Promise<Output>
): ReturnType<typeof query<Output>>;

export function withAuthQuery<Schema extends StandardSchemaV1, Output>(
  schema: Schema,
  fn: (input: StandardSchemaV1.InferOutput<Schema>, auth: AuthContext) => Promise<Output>
): ReturnType<typeof query<Schema, Output>>;

export function withAuthQuery<Schema extends StandardSchemaV1, Output>(
  schemaOrFn: Schema | ((auth: AuthContext) => Promise<Output>),
  maybeFn?: (input: StandardSchemaV1.InferOutput<Schema>, auth: AuthContext) => Promise<Output>
) {
  if (typeof schemaOrFn === 'function') {
    return query(async () => {
      const auth = getAuthContext();
      return schemaOrFn(auth);
    });
  }

  return query(schemaOrFn, async (input) => {
    const auth = getAuthContext();
    return maybeFn!(input, auth);
  });
}

export function withAuthCommand<Output>(
  fn: (auth: AuthContext) => Promise<Output>
): ReturnType<typeof command<Output>>;

export function withAuthCommand<Schema extends StandardSchemaV1, Output>(
  schema: Schema,
  fn: (input: StandardSchemaV1.InferOutput<Schema>, auth: AuthContext) => Promise<Output>
): ReturnType<typeof command<Schema, Output>>;

export function withAuthCommand<Schema extends StandardSchemaV1, Output>(
  schemaOrFn: Schema | ((auth: AuthContext) => Promise<Output>),
  maybeFn?: (input: StandardSchemaV1.InferOutput<Schema>, auth: AuthContext) => Promise<Output>
) {
  if (typeof schemaOrFn === 'function') {
    return command(async () => {
      const auth = getAuthContext();
      return schemaOrFn(auth);
    });
  }

  return command(schemaOrFn, async (input) => {
    const auth = getAuthContext();
    return maybeFn!(input, auth);
  });
}

type WithAuthFormInvalid<Schema extends StandardSchemaV1> = {
  [K in keyof StandardSchemaV1.InferOutput<Schema>]: (message?: string) => StandardSchemaV1.Issue;
};
type WithAuthFormContext<Schema extends StandardSchemaV1> = {
  auth: AuthContext;
  invalid: WithAuthFormInvalid<Schema> & ((message?: string) => StandardSchemaV1.Issue);
};

export function withAuthForm<Schema extends StandardSchemaV1<RemoteFormInput>, Output>(
  schema: Schema,
  fn: (
    data: StandardSchemaV1.InferOutput<Schema>,
    ctx: WithAuthFormContext<Schema>
  ) => Promise<Output>
) {
  return form<Schema, Output>(schema, async (data, invalid) => {
    const auth = getAuthContext();
    return fn(data, { auth, invalid: invalid as any });
  });
}
