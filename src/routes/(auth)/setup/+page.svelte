<script lang="ts">
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';

  import { FormManager } from '$lib/components/form/form-manager.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import * as InputGroup from '$lib/components/ui/input-group';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { SetupSchema } from '$lib/validators';

  import { remoteSetupForm } from './form.remote';

  const form = new FormManager(remoteSetupForm, {
    schema: SetupSchema
  });
  const generateSlug = () => {
    const name = form.getFieldValue('orgName');
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    form.setFieldValue('orgSlug', slug);
  };

  let showPassword = $state(false);
  const passwordType = $derived(showPassword ? 'text' : 'password');
</script>

<svelte:head>
  <title>Setup</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center sm:py-18">
  <Card.Root class="w-full rounded-none bg-card/50 sm:max-w-md sm:rounded-lg">
    <Card.Header>
      <Card.Title>First-time Setup</Card.Title>
      <Card.Description>
        Welcome to your new SvelteKit project! This page will guide you through the initial setup
        process.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form {...form.form} {@attach form.enhance}>
        <Field.Set disabled={form.isLoading}>
          <Field.Group class="gap-4">
            <Field.Field>
              <Field.Label class="asterisk">Organization Name</Field.Label>
              <Input placeholder="My Organization" {...form.getFieldProps('orgName', 'text')} />
              <Field.Error errors={form.getFieldIssues('orgName')} />
            </Field.Field>

            <Field.Field>
              <Field.Label class="asterisk">Organization Slug</Field.Label>
              <InputGroup.Root>
                <InputGroup.Input
                  class="lowercase"
                  placeholder="my-organization"
                  {...form.getFieldProps('orgSlug', 'text')}
                />
                <InputGroup.Addon align="inline-end">
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <InputGroup.Button {...props} onclick={generateSlug}>
                          <SparklesIcon />
                          <span class="sr-only">Generate</span>
                        </InputGroup.Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p>Generate</p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </InputGroup.Addon>
              </InputGroup.Root>
              <Field.Error errors={form.getFieldIssues('orgSlug')} />
            </Field.Field>

            <Field.Field>
              <Field.Label class="asterisk">Name</Field.Label>
              <Input placeholder="John Doe" {...form.getFieldProps('name', 'text')} />
              <Field.Error errors={form.getFieldIssues('name')} />
            </Field.Field>

            <Field.Field>
              <Field.Label class="asterisk">Email</Field.Label>
              <Input placeholder="john.doe@example.com" {...form.getFieldProps('email', 'email')} />
              <Field.Error errors={form.getFieldIssues('email')} />
            </Field.Field>

            <Field.Field>
              <Field.Label class="asterisk">Password</Field.Label>
              <InputGroup.Root>
                <InputGroup.Input
                  placeholder="••••••••••••••••"
                  {...form.getFieldProps('password', passwordType)}
                />
                <InputGroup.Addon align="inline-end">
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <InputGroup.Button
                          {...props}
                          onclick={() => (showPassword = !showPassword)}
                        >
                          {#if showPassword}
                            <EyeIcon />
                          {:else}
                            <EyeOffIcon />
                          {/if}
                          <span class="sr-only">
                            {showPassword ? 'Hide' : 'Show'} Password
                          </span>
                        </InputGroup.Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      <p>{showPassword ? 'Hide' : 'Show'} Password</p>
                    </Tooltip.Content>
                  </Tooltip.Root>
                </InputGroup.Addon>
              </InputGroup.Root>
              <Field.Error errors={form.getFieldIssues('password')} />
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </Card.Content>

    <Card.Footer class="justify-end gap-4 border-t bg-card">
      <Button form={form.formId} loading={form.isLoading} type="submit">Finish</Button>
    </Card.Footer>
  </Card.Root>
</div>
