/* eslint-disable ts/consistent-type-definitions */
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: import('$lib/server/auth/service').User | null;
      session: import('$lib/server/auth/service').Session | null;
    }
    interface PageData {
      user: App.Locals['user'];
      session: App.Locals['session'];
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
