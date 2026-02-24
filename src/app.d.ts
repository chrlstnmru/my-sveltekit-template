/* eslint-disable ts/consistent-type-definitions */
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: string;
        organizationId: string;
        email: string;
        username: string | null;
        displayName: string | null;
      } | null;
      session: {
        id: string;
        userId: string;
      } | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
