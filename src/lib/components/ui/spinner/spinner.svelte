<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import { cn } from '$lib/utils.js';

  let { class: className, ...restProps }: ComponentProps<typeof Loader2Icon> = $props();
</script>

<Loader2Icon
  class={cn('size-4 animate-spin', className)}
  aria-label="Loading"
  role="status"
  {...restProps}
/>
