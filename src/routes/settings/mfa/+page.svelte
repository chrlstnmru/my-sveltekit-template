<script lang="ts">
  import ShieldIcon from '@lucide/svelte/icons/shield';
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';

  import { goto } from '$app/navigation';
  import { FormManager } from '$lib/components/form/form-manager.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';

  import { remoteMfaSetupForm, remoteMfaVerifySetupForm } from './form.remote';
  import { MfaSetupSchema, MfaSetupVerifySchema } from './schemas';

  let step = $state<'select' | 'setup' | 'verify' | 'complete'>('select');
  let selectedMethod = $state<'totp' | 'email'>('totp');
  let secret = $state<string | null>(null);
  let backupCodes = $state<string[]>([]);

  const setupForm = new FormManager(remoteMfaSetupForm, {
    schema: MfaSetupSchema,
    usePreflight: true,
    onsuccess: (result) => {
      if (result && typeof result === 'object' && 'success' in result && result.success) {
        secret = ('secret' in result ? result.secret : null) ?? null;
        backupCodes = ('backupCodes' in result ? result.backupCodes : []) ?? [];
        step = 'verify';
      }
    }
  });

  const verifyForm = new FormManager(remoteMfaVerifySetupForm, {
    schema: MfaSetupVerifySchema,
    usePreflight: true,
    onsuccess: () => {
      step = 'complete';
    }
  });

  function handleMethodSelect() {
    setupForm.setFieldValue('method', selectedMethod);
  }
</script>

<svelte:head>
  <title>MFA Setup</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center sm:py-18">
  <Card.Root class="w-full rounded-none bg-card/50 sm:max-w-md sm:rounded-lg">
    <Card.Header>
      <Card.Title>Two-Factor Authentication Setup</Card.Title>
      <Card.Description>
        {#if step === 'select'}
          Choose your preferred authentication method.
        {:else if step === 'verify'}
          Scan the QR code with your authenticator app and enter the code.
        {:else if step === 'complete'}
          Two-factor authentication has been enabled for your account.
        {/if}
      </Card.Description>
    </Card.Header>

    <Card.Content>
      {#if step === 'select'}
        <div class="space-y-4">
          <RadioGroup bind:value={selectedMethod}>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="totp" value="totp" />
              <Label for="totp">Authenticator App (TOTP)</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="email" value="email" />
              <Label for="email">Email Verification</Label>
            </div>
          </RadioGroup>
        </div>
      {:else if step === 'setup'}
        <form id="mfa-setup-form" {...setupForm.form} {@attach setupForm.enhance}>
          <input name="method" type="hidden" value={selectedMethod} />
          <div class="space-y-6">
            <div class="flex justify-center">
              <ShieldIcon class="size-24 text-muted-foreground" />
            </div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">
                {#if selectedMethod === 'totp'}
                  You'll need an authenticator app like Google Authenticator or Authy.
                {:else}
                  You'll receive a verification code via email.
                {/if}
              </p>
            </div>
          </div>
        </form>
      {:else if step === 'verify'}
        <form id="mfa-verify-form" {...verifyForm.form} {@attach verifyForm.enhance}>
          <Field.Set disabled={verifyForm.isLoading}>
            <Field.Group class="gap-4">
              {#if secret && selectedMethod === 'totp'}
                <div class="space-y-2">
                  <Label>Secret Key</Label>
                  <div class="rounded-md bg-muted p-3 font-mono text-sm break-all">
                    {secret}
                  </div>
                </div>
              {/if}

              <Field.Field>
                <Field.Label class="asterisk">Verification Code</Field.Label>
                <Input
                  class="text-center text-2xl tracking-[0.5em]"
                  maxlength={6}
                  placeholder="000000"
                  {...verifyForm.getFieldProps('code', 'text')}
                />
                <Field.Error errors={verifyForm.getFieldIssues('code')} />
              </Field.Field>
            </Field.Group>
          </Field.Set>
        </form>
      {:else if step === 'complete'}
        <div class="space-y-6">
          <div class="flex justify-center">
            <ShieldCheckIcon class="size-24 text-green-500" />
          </div>

          {#if backupCodes.length > 0}
            <div class="space-y-2">
              <Label>Backup Codes</Label>
              <p class="text-sm text-muted-foreground">
                Save these codes in a safe place. You can use them to access your account if you
                lose your authenticator.
              </p>
              <div class="grid grid-cols-2 gap-2 rounded-md bg-muted p-3 font-mono text-sm">
                {#each backupCodes as code}
                  <div>{code}</div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </Card.Content>

    <Card.Footer class="justify-end gap-4 border-t bg-card">
      {#if step === 'select'}
        <Button
          onclick={() => {
            handleMethodSelect();
            step = 'setup';
          }}
>Continue</Button>
      {:else if step === 'setup'}
        <Button onclick={() => (step = 'select')} variant="outline">Back</Button>
        <Button form="mfa-setup-form" loading={setupForm.isLoading}>Set Up</Button>
      {:else if step === 'verify'}
        <Button onclick={() => (step = 'setup')} variant="outline">Back</Button>
        <Button form="mfa-verify-form" loading={verifyForm.isLoading}>Verify</Button>
      {:else if step === 'complete'}
        <Button onclick={() => goto('/')}>Done</Button>
      {/if}
    </Card.Footer>
  </Card.Root>
</div>
