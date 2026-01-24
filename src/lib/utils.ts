import type { ClassValue } from 'clsx';
import type { Snippet } from 'svelte';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: Snippet } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: Snippet } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
