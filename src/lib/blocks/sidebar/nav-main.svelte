<script lang="ts">
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import type { AppRoute } from '$lib/constants/config';

  import { page } from '$app/state';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Sidebar from '$lib/components/ui/sidebar';

  let {
    items
  }: {
    items: AppRoute[];
  } = $props();

  const currentPath = $derived(page.url.pathname.substring(1));
  const sidebarItems = $derived(items.filter((item) => !item.hideInSidebar));
</script>

<Sidebar.Group>
  <Sidebar.GroupLabel>Modules</Sidebar.GroupLabel>
  <Sidebar.Menu>
    {#each sidebarItems as item (item.title)}
      {@const hasActiveSubItem = item.items?.some((subItem) => {
        if (currentPath.length === 0 && subItem.url === '/') return true;
        else if (currentPath.length === 0) return false;
        return subItem.url?.substring(1).startsWith(currentPath);
      })}
      <Collapsible.Root class="group/collapsible" open={hasActiveSubItem}>
        {#snippet child({ props })}
          <Sidebar.MenuItem {...props}>
            {#if item.items && item.items.length > 0}
              <Collapsible.Trigger>
                {#snippet child({ props })}
                  <Sidebar.MenuButton class="text-foreground/80" {...props}>
                    {#if item.icon}
                      <item.icon />
                    {/if}
                    <span>{item.title}</span>
                    <ChevronRightIcon
                      class="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </Sidebar.MenuButton>
                {/snippet}
              </Collapsible.Trigger>

              <Collapsible.Content>
                <Sidebar.MenuSub>
                  {#each item.items as subItem (subItem.title)}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuSubButton
                        class="text-foreground/80"
                        isActive={currentPath === subItem.url}
                      >
                        {#snippet child({ props })}
                          <a href={subItem.url} {...props}>
                            <span>{subItem.title}</span>
                          </a>
                        {/snippet}
                      </Sidebar.MenuSubButton>
                    </Sidebar.MenuSubItem>
                  {/each}
                </Sidebar.MenuSub>
              </Collapsible.Content>
            {:else}
              <Sidebar.MenuButton class="text-foreground/80" isActive={currentPath === item.url}>
                {#snippet child({ props })}
                  <a href={item.url} {...props}>
                    {#if item.icon}
                      <item.icon />
                    {/if}
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            {/if}
          </Sidebar.MenuItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  </Sidebar.Menu>
</Sidebar.Group>
