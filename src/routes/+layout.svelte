<script lang="ts">
  import type { AppRoute } from '$lib/config';

  import { page } from '$app/state';
  import favicon from '$lib/assets/favicon.svg';
  import { Toaster } from '$lib/components/ui/sonner';
  import { TooltipProvider } from '$lib/components/ui/tooltip';
  import { APP_ROUTES } from '$lib/config';
  import { setAuthContext } from '$lib/hooks/auth.svelte';

  import '../app.css';

  let { children } = $props();

  const pageTitle = $derived.by(() => {
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

    const route = findRoute(APP_ROUTES, page.url.pathname);
    return route ? `${route.title} |` : '';
  });

  setAuthContext();
</script>

<svelte:head>
  <link href={favicon} rel="icon" />
  <title>
    {pageTitle} Template
  </title>
</svelte:head>

<TooltipProvider>
  <Toaster richColors />
  {@render children()}
</TooltipProvider>
