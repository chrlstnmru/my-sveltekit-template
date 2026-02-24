<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import { Toaster } from '$lib/components/ui/sonner';
  import { TooltipProvider } from '$lib/components/ui/tooltip';

  import '../app.css';

  let { children } = $props();
</script>

<svelte:head><link href={favicon} rel="icon" /></svelte:head>

<TooltipProvider>
  <Toaster richColors />
  {@render children()}
</TooltipProvider>
