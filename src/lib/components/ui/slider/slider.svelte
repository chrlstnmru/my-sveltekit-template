<script lang="ts">
  import { Slider as SliderPrimitive } from 'bits-ui';

  import type { WithoutChildrenOrChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    value = $bindable(),
    orientation = 'horizontal',
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SliderPrimitive.RootProps> = $props();
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
  class={cn(
    'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
    className
  )}
  data-slot="slider"
  {orientation}
  bind:ref
  bind:value={value as never}
  {...restProps}
>
  {#snippet children({ thumbs })}
    <span
      class={cn(
        'relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5'
      )}
      data-orientation={orientation}
      data-slot="slider-track"
    >
      <SliderPrimitive.Range
        class={cn(
          'absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
        )}
        data-slot="slider-range"
      />
    </span>
    {#each thumbs as thumb (thumb)}
      <SliderPrimitive.Thumb
        class="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        data-slot="slider-thumb"
        index={thumb}
      />
    {/each}
  {/snippet}
</SliderPrimitive.Root>
