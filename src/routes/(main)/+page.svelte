<script lang="ts">
  import { useAuth } from '$lib/hooks/use-auth.svelte.js';
  import { Container } from '$lib/layouts';

  const auth = useAuth();
</script>

<Container>
  <h1>Welcome to SvelteKit, {auth.user?.displayName}!</h1>
</Container>
