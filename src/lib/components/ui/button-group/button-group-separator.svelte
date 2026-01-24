<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { Separator } from '$lib/components/ui/separator/index.js';
  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    orientation = 'vertical',
    ...restProps
  }: ComponentProps<typeof Separator> = $props();
</script>

<Separator
  class={cn('relative !m-0 self-stretch bg-input data-[orientation=vertical]:h-auto', className)}
  data-slot="button-group-separator"
  {orientation}
  bind:ref
  {...restProps}
/>
