<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import * as Sidebar from '$lib/components/ui/sidebar';
  import { APP_ROUTES } from '$lib/config';

  import NavMain from './nav-main.svelte';
  import NavUser from './nav-user.svelte';

  let {
    ref = $bindable(null),
    collapsible = 'icon',
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps} bind:ref>
  <Sidebar.Header>
    <h1>My App</h1>
  </Sidebar.Header>

  <Sidebar.Content>
    <NavMain items={APP_ROUTES} />
  </Sidebar.Content>

  <Sidebar.Footer>
    <NavUser
      user={{
        name: 'Charlestone',
        email: 'chrlstnmru@gmail.com',
        avatar: 'https://i.pravatar.cc/300?img=1'
      }}
    />
  </Sidebar.Footer>
</Sidebar.Root>
