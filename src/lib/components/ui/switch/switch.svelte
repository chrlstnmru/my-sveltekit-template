<script lang="ts">
  import { Switch as SwitchPrimitive } from 'bits-ui';

  import type { WithoutChildrenOrChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    checked = $bindable(false),
    ...restProps
  }: Omit<WithoutChildrenOrChild<SwitchPrimitive.RootProps>, 'type'> & { type?: any } = $props();

  const { type: _, ...noTypeProps } = $derived(restProps);
</script>

<SwitchPrimitive.Root
  class={cn(
    'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
    className
  )}
  data-slot="switch"
  type="button"
  bind:ref
  bind:checked
  {...noTypeProps}
>
  <SwitchPrimitive.Thumb
    class={cn(
      'pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground'
    )}
    data-slot="switch-thumb"
  />
</SwitchPrimitive.Root>
