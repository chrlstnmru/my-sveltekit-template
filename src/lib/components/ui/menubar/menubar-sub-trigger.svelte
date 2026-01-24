<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Menubar as MenubarPrimitive } from 'bits-ui';

  import type { WithoutChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    inset = undefined,
    children,
    ...restProps
  }: WithoutChild<MenubarPrimitive.SubTriggerProps> & {
    inset?: boolean;
  } = $props();
</script>

<MenubarPrimitive.SubTrigger
  class={cn(
    'flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[inset]:ps-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
    className
  )}
  data-inset={inset}
  data-slot="menubar-sub-trigger"
  bind:ref
  {...restProps}
>
  {@render children?.()}
  <ChevronRightIcon class="ms-auto size-4" />
</MenubarPrimitive.SubTrigger>
