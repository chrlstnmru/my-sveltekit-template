<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<caption
  bind:this={ref}
  class={cn('mt-4 text-sm text-muted-foreground', className)}
  data-slot="table-caption"
  {...restProps}
>
  {@render children?.()}
</caption>
