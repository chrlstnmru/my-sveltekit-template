<script lang="ts">
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();
</script>

<h1>Welcome to SvelteKit, {data.user?.displayName}!</h1>

<form action="/logout" method="POST">
  <Button type="submit">Log out</Button>
</form>
