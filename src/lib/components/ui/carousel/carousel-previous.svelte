<script lang="ts">
  import type { WithoutChildren } from 'bits-ui';

  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import type { Props } from '$lib/components/ui/button/index.js';

  import { Button } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';

  import { getEmblaContext } from './context.js';

  let {
    ref = $bindable(null),
    class: className,
    variant = 'outline',
    size = 'icon',
    ...restProps
  }: WithoutChildren<Props> = $props();

  const emblaCtx = getEmblaContext('<Carousel.Previous/>');
</script>

<Button
  class={cn(
    'absolute size-8 rounded-full',
    emblaCtx.orientation === 'horizontal'
      ? '-start-12 top-1/2 -translate-y-1/2'
      : 'start-1/2 -top-12 -translate-x-1/2 rotate-90',
    className
  )}
  aria-disabled={!emblaCtx.canScrollPrev}
  data-slot="carousel-previous"
  onclick={emblaCtx.scrollPrev}
  onkeydown={emblaCtx.handleKeyDown}
  {size}
  {variant}
  {...restProps}
  bind:ref
>
  <ArrowLeftIcon class="size-4" />
  <span class="sr-only">Previous slide</span>
</Button>
