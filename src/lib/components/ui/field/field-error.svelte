<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  import type { WithElementRef } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    children,
    errors: errorList,
    limit = 1,
    showBullets,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    children?: Snippet;
    errors?: { message?: string }[];
    limit?: number;
    showBullets?: boolean;
  } = $props();

  const hasContent = $derived.by(() => {
    // has slotted error
    if (children) return true;

    // no errors
    if (!errorList) return false;

    // has an error but no message
    if (errorList.length === 1 && !errorList[0]?.message) {
      return false;
    }

    return true;
  });

  const errors = $derived.by(() => {
    if (!errorList) return [];
    if (limit && limit >= 0) return errorList.slice(0, limit);
    return errorList;
  });
</script>

{#if hasContent}
  <div
    bind:this={ref}
    class={cn('text-sm font-normal text-destructive', className)}
    data-slot="field-error"
    role="alert"
    {...restProps}>
    {#if children}
      {@render children()}
    {:else}
      <ul
        class={cn('flex  flex-col gap-1', {
          'ms-4 list-disc': showBullets,
        })}>
        {#each errors ?? [] as error, index (index)}
          {#if error?.message}
            <li>{error.message}</li>
          {/if}
        {/each}
      </ul>
    {/if}
  </div>
{/if}
