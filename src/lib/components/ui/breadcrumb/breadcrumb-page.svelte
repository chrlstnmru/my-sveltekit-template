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
  class={cn('font-normal text-foreground', className)}
  aria-current="page"
  aria-disabled="true"
  data-slot="breadcrumb-page"
  role="link"
  {...restProps}
>
  {@render children?.()}
</span>
