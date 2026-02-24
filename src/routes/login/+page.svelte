<script lang="ts">
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeOffIcon from '@lucide/svelte/icons/eye-off';
  import { toast } from 'svelte-sonner';

  import { FormManager, FormValidationError } from '$lib/components/form/form-manager.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import * as InputGroup from '$lib/components/ui/input-group';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { LoginSchema } from '$lib/validators';

  import { remoteLoginForm } from './form.remote';

  const form = new FormManager(remoteLoginForm, {
    schema: LoginSchema,
    usePreflight: true,
    onfailure: (error, fm) => {
      if (error instanceof FormValidationError) {
        fm.setFieldValue('password', '');
        toast.error('Login failed', {
          description: error.issues[0].message,
          position: 'top-center'
        });
      }
    }
  });

  let showPassword = $state(false);
  const passwordType = $derived(showPassword ? 'text' : 'password');

  $inspect(form.getFieldIssues('password'));
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center sm:py-18">
  <Card.Root class="w-full rounded-none bg-card/50 sm:max-w-md sm:rounded-lg">
    <Card.Header>
      <Card.Title>Login</Card.Title>
      <Card.Description>Enter your credentials to access your account.</Card.Description>
    </Card.Header>
    <Card.Content class="">
      <form id="login-form" {...form.form} {@attach form.enhance}>
        <Field.Set disabled={form.isLoading}>
          <Field.Group class="gap-4">
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

            <Field.Field>
              <div class="flex items-center gap-2">
                <Checkbox
                  name={form.getFieldProps('rememberMe', 'checkbox').name}
                  aria-invalid={form.getFieldProps('rememberMe', 'checkbox')['aria-invalid']}
                  checked={form.getFieldProps('rememberMe', 'checkbox').checked}
                  onCheckedChange={(e) => form.setFieldValue('rememberMe', e)}
                  value={form.getFieldProps('rememberMe', 'checkbox').value}
                />
                <Field.Label class="mt-0!">Remember me</Field.Label>
              </div>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </Card.Content>

    <Card.Footer class="justify-end gap-4 border-t bg-card">
      <Button class="w-full" form="login-form" loading={form.isLoading} type="submit">Login</Button>
    </Card.Footer>
  </Card.Root>
</div>
