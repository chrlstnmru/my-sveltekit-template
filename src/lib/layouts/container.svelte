<script lang="ts">
  import type { Snippet } from 'svelte';

  import { page } from '$app/state';
  import { getRoute } from '$lib/config';
  import { cn } from '$lib/utils';

  const {
    class: className,
    children,
    header
  }: {
    class?: string;
    children?: Snippet;
    header?: Snippet<[{ props: { title?: string; description?: string } }]>;
  } = $props();

  const route = $derived(getRoute(page.url.pathname));
</script>

<div class="overflow-y-auto">
  <div class={cn('mx-auto w-full max-w-screen-xl p-8', className)}>
    {#if header}
      {@render header({ props: { title: route?.title, description: route?.description } })}
    {:else}
      <div>
        <h1 class="text-4xl font-semibold">{route?.title}</h1>
        <p class="text-muted-foreground">{route?.description}</p>
      </div>
    {/if}

    {@render children?.()}
  </div>
</div>
