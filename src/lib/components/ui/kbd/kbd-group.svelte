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

<kbd
  bind:this={ref}
  class={cn('inline-flex items-center gap-1', className)}
  data-slot="kbd-group"
  {...restProps}
>
  {@render children?.()}
</kbd>
