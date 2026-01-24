<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef, WithoutChildren } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
  bind:this={ref}
  class={cn('animate-pulse rounded-md bg-accent', className)}
  data-slot="skeleton"
  {...restProps}
></div>
