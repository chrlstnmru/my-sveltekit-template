<script lang="ts" module>
  import type { AppRoute } from '$lib/constants/config';

  import { APP_ROUTES } from '$lib/constants/config';

  function getCrumbs(currentPath: string) {
    const crumbs: { title: string; url: string; current: boolean; navigateable?: boolean }[] = [];

    const parts = currentPath.split('/').filter(Boolean);
    const urls =
      parts.length === 0 ? ['/'] : parts.map((_, i) => `/${parts.slice(0, i + 1).join('/')}`);

    const findRoute = (routes: AppRoute[], url: string): AppRoute | null => {
      for (const route of routes) {
        if (route.url === url) return route;

        if (route.items) {
          const found = findRoute(route.items, url);
          if (found) return found;
        }
      }
      return null;
    };

    for (const url of urls) {
      const route = findRoute(APP_ROUTES, url);
      if (route?.url) {
        crumbs.push({
          title: route.title,
          url,
          current: url === currentPath,
          navigateable: route.navigateable ?? true
        });
      }
    }

    return crumbs;
  }
</script>

<script lang="ts">
  import { page } from '$app/state';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { cn } from '$lib/utils';

  const crumbs = $derived(getCrumbs(page.url.pathname));
</script>

<Breadcrumb.Root>
  <Breadcrumb.List>
    {#each crumbs as crumb, i (crumb.url)}
      {#if i > 0}
        <Breadcrumb.Separator />
      {/if}
      <Breadcrumb.Item>
        {#if crumb.current || !crumb.navigateable}
          <Breadcrumb.Page class={cn({ 'text-foreground/80': !crumb.navigateable })}>
            {crumb.title}
          </Breadcrumb.Page>
        {:else}
          <Breadcrumb.Link class="text-foreground/80" href={crumb.url}>
            {crumb.title}
          </Breadcrumb.Link>
        {/if}
      </Breadcrumb.Item>
    {/each}
  </Breadcrumb.List>
</Breadcrumb.Root>
