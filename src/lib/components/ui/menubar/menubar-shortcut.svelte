<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
  bind:this={ref}
  class={cn('ms-auto text-xs tracking-widest text-muted-foreground', className)}
  data-slot="menubar-shortcut"
  {...restProps}
>
  {@render children?.()}
</span>
