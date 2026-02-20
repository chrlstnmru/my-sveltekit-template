import type {
  AnchorElementProps,
  ButtonElementProps,
  ButtonProps,
  ButtonPropsWithoutHTML,
  ButtonSize,
  ButtonVariant
} from '$lib/components/ui/button/button.svelte';

import Root, { buttonVariants } from '$lib/components/ui/button/button.svelte';

export {
  type AnchorElementProps,
  //
  Root as Button,
  type ButtonElementProps,
  type ButtonProps,
  type ButtonPropsWithoutHTML,
  type ButtonSize,
  type ButtonVariant,
  buttonVariants,
  type ButtonProps as Props,
  Root
};
