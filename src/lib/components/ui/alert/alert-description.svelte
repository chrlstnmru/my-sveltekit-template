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
    'col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed',
    className
  )}
  data-slot="alert-description"
  {...restProps}
>
  {@render children?.()}
</div>
