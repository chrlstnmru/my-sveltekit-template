<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  import { FormManager } from '$lib/components/form/form-manager.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import * as Card from '$lib/components/ui/card';
  import * as Field from '$lib/components/ui/field';
  import { InputNumber } from '$lib/components/ui/input-number';
  import { useAuth } from '$lib/hooks/use-auth.svelte';
  import {
    remoteGetSessionPolicy,
    remoteUpdateSessionPolicy
  } from '$lib/remote/organization.remote';
  import { cn } from '$lib/utils';
  import { SessionPolicySchema } from '$lib/validators';

  const auth = useAuth();

  const defaultValues = await remoteGetSessionPolicy({
    organizationId: auth.user?.organizationId
  });

  const form = new FormManager(remoteUpdateSessionPolicy, {
    schema: SessionPolicySchema,
    defaultValues,
    usePreflight: true,
    onfailure: (error) => {
      console.error(error);
    },
    onsuccess: () => {
      toast.success('Session policy updated');
    }
  });

  const isFormTainted = $derived(form.isTainted);
</script>

{#snippet FieldHint(props: {
  hint?: string;
  errors?: {
    message?: string;
  }[];
})}
  <div class={cn('mt-2 font-mono', { 'h-4': !!props.hint })}>
    {#if props.errors?.length === 0}
      <p
        class="text-right text-xs text-muted-foreground"
        in:fade={{ duration: 50, delay: 50 }}
        out:fade={{ duration: 50 }}
      >
        {props.hint}
      </p>
    {:else}
      <div in:fade={{ duration: 50, delay: 50 }} out:fade={{ duration: 50 }}>
        <Field.Error class="text-xs" errors={props.errors} />
      </div>
    {/if}
  </div>
{/snippet}

{#snippet NumberInputField(props: {
  title: string;
  description?: string;
  fieldProps: ReturnType<typeof form.getFieldProps>;
  onValueChange?: (value: any) => void;
  errors?: { message?: string }[];
  hint?: string;
  suffix?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  decimalScale?: number;
})}
  <Field.Field class="flex-row items-center">
    <div>
      <Field.Label>{props.title}</Field.Label>
      <Field.Description>{props.description}</Field.Description>
    </div>
    <div class="flex max-w-md flex-col justify-end">
      {#if props.suffix}
        <ButtonGroup.Root class="w-full">
          <InputNumber {...props.fieldProps} emptyAsZero placeholder={props.placeholder} />
          <ButtonGroup.Text class="font-mono font-normal text-muted-foreground">
            {props.suffix}
          </ButtonGroup.Text>
        </ButtonGroup.Root>
      {:else}
        <InputNumber
          {...props.fieldProps}
          decimalScale={props.decimalScale}
          emptyAsZero
          formatOnMount
          max={props.max}
          min={props.min}
          placeholder={props.placeholder}
          step={props.step}
        />
      {/if}

      {@render FieldHint({
        hint: props.hint,
        errors: props.errors
      })}
    </div>
  </Field.Field>
{/snippet}

<section class="pt-12">
  <h2 class="mb-6 text-xl font-medium">Session Policy</h2>

  <Card.Root class="pt-5">
    <form {...form.form} {@attach form.enhance}>
      <Field.Group class="gap-0 *:px-5 *:not-first:pt-5 *:not-last:border-b *:not-last:pb-5">
        {@render NumberInputField({
          title: 'Maximum Concurrent Sessions',
          description: 'Set the maximum number of concurrent sessions',
          hint: 'Set the value to 0 to disable this feature',
          fieldProps: form.getFieldProps('maxConcurrentSessions', 'text'),
          errors: form.getFieldIssues('maxConcurrentSessions'),
          suffix: 'sessions',
          onValueChange: (e) => form.setFieldValue('maxConcurrentSessions', e)
        })}

        {@render NumberInputField({
          title: 'Idle Timeout',
          description: 'Set the idle timeout for idle sessions',
          hint: 'Set the value to 0 to disable this feature',
          fieldProps: form.getFieldProps('sessionIdleTimeoutMinutes', 'text'),
          errors: form.getFieldIssues('sessionIdleTimeoutMinutes'),
          suffix: 'minutes'
        })}

        {@render NumberInputField({
          title: 'Access Token Lifetime',
          description: 'Set the lifetime of access tokens',
          fieldProps: form.getFieldProps('accessTokenLifetimeMinutes', 'text'),
          errors: form.getFieldIssues('accessTokenLifetimeMinutes'),
          suffix: 'minutes'
        })}

        {@render NumberInputField({
          title: 'Refresh Token Lifetime',
          description: 'Set the timeout for active sessions',
          fieldProps: form.getFieldProps('refreshTokenLifetimeMinutes', 'text'),
          errors: form.getFieldIssues('refreshTokenLifetimeMinutes'),
          suffix: 'minutes'
        })}

        {@render NumberInputField({
          title: 'Remember Me',
          description: 'Set how long to remember the user session',
          hint: 'Set the value to 0 to disable this feature',
          fieldProps: form.getFieldProps('rememberMeDays', 'text'),
          errors: form.getFieldIssues('rememberMeDays'),
          suffix: 'days'
        })}
      </Field.Group>
    </form>

    <Card.Footer class="justify-end gap-4 border-t p-5!">
      {#if isFormTainted}
        <Button
          disabled={form.isLoading}
          form={form.formId}
          onclick={() => form.reset()}
          size="sm"
          variant="outline"
        >
          Cancel
        </Button>
      {/if}
      <Button
        disabled={!isFormTainted}
        form={form.formId}
        loading={form.isLoading}
        size="sm"
        type="submit"
      >
        Save
      </Button>
    </Card.Footer>
  </Card.Root>
</section>
