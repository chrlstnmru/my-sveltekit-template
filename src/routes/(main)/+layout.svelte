<script lang="ts">
  import SearchIcon from '@lucide/svelte/icons/search';
  import { toast } from 'svelte-sonner';

  import { shortcut } from '$lib/actions/shortcut.svelte';
  import Breadcrumbs from '$lib/blocks/breadcrumbs/breadcrumbs.svelte';
  import { AppSidebar } from '$lib/blocks/sidebar';
  import { Button } from '$lib/components/ui/button';
  import * as Kbd from '$lib/components/ui/kbd';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { ctrlOrCmdKey } from '$lib/hooks/is-mac.svelte';

  const { children } = $props();
</script>

<svelte:window
  use:shortcut={[
    {
      key: 'k',
      ctrl: true,
      callback: () => {
        toast.warning('Search shortcut triggered');
      }
    }
  ]}
/>

<Sidebar.Provider class="h-screen w-screen">
  <AppSidebar />

  <Sidebar.Inset class="overflow-y-hidden">
    <header class="flex h-14 shrink-0 items-center justify-between gap-2 border-b pr-4">
      <div class="flex items-center gap-2 px-3">
        <Sidebar.Trigger />
        <Separator class="me-2 h-4" orientation="vertical" />
        <Breadcrumbs />
      </div>
      <div>
        <Button class="min-w-40 justify-between px-2 shadow-none" size="sm" variant="outline">
          <div class="flex place-items-center gap-2 text-muted-foreground">
            <SearchIcon />
            <span>Search</span>
          </div>

          <Kbd.Root>{ctrlOrCmdKey} + K</Kbd.Root>
        </Button>
      </div>
    </header>
    {@render children?.()}
  </Sidebar.Inset>
</Sidebar.Provider>
