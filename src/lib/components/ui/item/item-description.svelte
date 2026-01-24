<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<p
  bind:this={ref}
  class={cn(
    'line-clamp-2 text-sm leading-normal font-normal text-balance text-muted-foreground',
    '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
    className
  )}
  data-slot="item-description"
  {...restProps}
>
  {@render children?.()}
</p>
