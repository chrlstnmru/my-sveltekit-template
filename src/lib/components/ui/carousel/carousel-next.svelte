<script lang="ts">
  import type { WithoutChildren } from 'bits-ui';

  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

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

  const emblaCtx = getEmblaContext('<Carousel.Next/>');
</script>

<Button
  class={cn(
    'absolute size-8 rounded-full',
    emblaCtx.orientation === 'horizontal'
      ? '-end-12 top-1/2 -translate-y-1/2'
      : 'start-1/2 -bottom-12 -translate-x-1/2 rotate-90',
    className
  )}
  aria-disabled={!emblaCtx.canScrollNext}
  data-slot="carousel-next"
  onclick={emblaCtx.scrollNext}
  onkeydown={emblaCtx.handleKeyDown}
  {size}
  {variant}
  bind:ref
  {...restProps}
>
  <ArrowRightIcon class="size-4" />
  <span class="sr-only">Next slide</span>
</Button>
