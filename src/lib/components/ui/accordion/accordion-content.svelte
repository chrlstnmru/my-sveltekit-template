<script lang="ts">
  import { Accordion as AccordionPrimitive } from 'bits-ui';

  import type { WithoutChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
  class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
  data-slot="accordion-content"
  bind:ref
  {...restProps}
>
  <div class={cn('pt-0 pb-4', className)}>
    {@render children?.()}
  </div>
</AccordionPrimitive.Content>
