<script lang="ts">
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

  import { FormManager } from '$lib/components/form/form-manager.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { MfaVerifySchema } from '$lib/validators';

  import { remoteMfaForm } from './form.remote';

  const form = new FormManager(remoteMfaForm, {
    schema: MfaVerifySchema,
    usePreflight: true
  });
</script>

<svelte:head>
  <title>MFA Verification</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center sm:py-18">
  <Card.Root class="w-full rounded-none bg-card/50 sm:max-w-md sm:rounded-lg">
    <Card.Header>
      <Card.Title>Two-Factor Authentication</Card.Title>
      <Card.Description>
        Enter the 6-digit code from your authenticator app to continue.
      </Card.Description>
    </Card.Header>
    <Card.Content class="">
      <form id="mfa-form" {...form.form} {@attach form.enhance}>
        <Field.Set disabled={form.isLoading}>
          <Field.Group class="gap-4">
            <div class="flex justify-center py-4">
              <ShieldCheckIcon class="size-16 text-muted-foreground" />
            </div>

            <Field.Field>
              <Field.Label class="sr-only asterisk">Verification Code</Field.Label>
              <Input
                class="text-center text-2xl tracking-[0.5em]"
                maxlength={6}
                placeholder="000000"
                {...form.getFieldProps('code', 'text')}
              />
              <Field.Error errors={form.getFieldIssues('code')} />
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </Card.Content>

    <Card.Footer class="justify-end gap-4 border-t bg-card">
      <Button form="mfa-form" loading={form.isLoading} type="submit">Verify</Button>
    </Card.Footer>
  </Card.Root>
</div>
