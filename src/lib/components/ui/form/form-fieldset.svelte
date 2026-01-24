<script generics="T extends Record<string, unknown>, U extends FormPath<T>" lang="ts">
  import type { FormPath } from 'sveltekit-superforms';

  import * as FormPrimitive from 'formsnap';

  import type { WithoutChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    form,
    name,
    ...restProps
  }: WithoutChild<FormPrimitive.FieldsetProps<T, U>> = $props();
</script>

<FormPrimitive.Fieldset {name} class={cn('space-y-2', className)} {form} bind:ref {...restProps} />
