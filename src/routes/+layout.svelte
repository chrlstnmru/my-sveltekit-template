<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';

  import './layout.css';

  let { children } = $props();
</script>

<svelte:head><link href={favicon} rel="icon" /></svelte:head>
{@render children()}
