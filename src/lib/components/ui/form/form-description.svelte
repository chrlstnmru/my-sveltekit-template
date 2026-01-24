<script lang="ts">
  import * as FormPrimitive from 'formsnap';

  import type { WithoutChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChild<FormPrimitive.DescriptionProps> = $props();
</script>

<FormPrimitive.Description
  class={cn('text-sm text-muted-foreground', className)}
  data-slot="form-description"
  bind:ref
  {...restProps}
/>
