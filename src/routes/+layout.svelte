<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import { TooltipProvider } from '$lib/components/ui/tooltip';

  import '../app.css';

  let { children } = $props();
</script>

<svelte:head><link href={favicon} rel="icon" /></svelte:head>

<TooltipProvider>
  {@render children()}
</TooltipProvider>
