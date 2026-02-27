<script lang="ts">
  import { Container } from '$lib/layouts';

  import FormPasswordPolicy from './components/form-password-policy.svelte';
  import FormSessionPolicy from './components/form-session-policy.svelte';
</script>

<Container class="pb-16">
  <FormSessionPolicy />
  <FormPasswordPolicy />
</Container>
