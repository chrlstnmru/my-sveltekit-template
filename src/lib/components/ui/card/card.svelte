<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  class={cn(
    'flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm',
    'has-[*>[data-slot="card-header"]]:pt-0',
    'has-[*>[data-slot="card-footer"]]:pb-0',
    className
  )}
  data-slot="card"
  {...restProps}
>
  {@render children?.()}
</div>
