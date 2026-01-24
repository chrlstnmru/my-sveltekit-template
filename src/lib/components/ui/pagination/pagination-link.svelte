<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';

  import type { Props } from '$lib/components/ui/button/index.js';

  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    size = 'icon',
    isActive,
    page,
    children,
    ...restProps
  }: PaginationPrimitive.PageProps &
    Props & {
      isActive: boolean;
    } = $props();
</script>

{#snippet Fallback()}
  {page.value}
{/snippet}

<PaginationPrimitive.Page
  class={cn(
    buttonVariants({
      variant: isActive ? 'outline' : 'ghost',
      size
    }),
    className
  )}
  aria-current={isActive ? 'page' : undefined}
  children={children || Fallback}
  data-active={isActive}
  data-slot="pagination-link"
  {page}
  bind:ref
  {...restProps}
/>
