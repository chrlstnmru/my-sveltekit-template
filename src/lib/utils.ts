import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  const twMerge = extendTailwindMerge({
    extend: {
      classGroups: {
        spinner: ['spinner-none', 'spinner-auto']
      },
      conflictingClassGroups: {
        spinner: ['spinner-none', 'spinner-auto']
      }
    }
  });

  return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export type MaybePromise<T> = T | Promise<T>;

export type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type PartialAll<T> = {
  [K in keyof T]?: T[K] extends object ? PartialAll<T[K]> : T[K];
};
