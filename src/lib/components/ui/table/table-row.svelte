<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
  bind:this={ref}
  class={cn(
    'border-b transition-colors data-[state=selected]:bg-muted hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50',
    className
  )}
  data-slot="table-row"
  {...restProps}
>
  {@render children?.()}
</tr>
