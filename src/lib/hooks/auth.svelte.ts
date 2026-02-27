import { getContext, setContext } from 'svelte';

import { page } from '$app/state';

type AuthContext = {
  user: NonNullable<App.Locals['user']>;
};

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | ({ status: 'authenticated' } & AuthContext);

const AUTH_CTX_KEY = Symbol('auth');

export function setAuthContext() {
  return setContext(AUTH_CTX_KEY, new AuthManager());
}

export function useAuth() {
  const ctx = getContext<AuthManager>(AUTH_CTX_KEY);
  if (!ctx) {
    throw new Error('Auth context not found');
  }
  return ctx;
}

class AuthManager {
  private state = $state<AuthState>({ status: 'loading' });
  private initialized = $state(false);

  get user() {
    return this.state.status === 'authenticated' ? this.state.user : null;
  }

  get isLoading() {
    return this.state.status === 'loading';
  }

  get isAuthenticated() {
    return this.state.status === 'authenticated' && this.initialized;
  }

  constructor() {
    this.checkAuth();

    $effect(() => {
      // eslint-disable-next-line ts/no-unused-expressions
      page.data.user;

      this.checkAuth();
    });
  }

  private checkAuth() {
    const userData = page.data.user;

    if (userData) {
      this.state = { status: 'authenticated', user: userData };
    } else {
      this.state = { status: 'unauthenticated' };
    }

    this.initialized = true;
  }
}
