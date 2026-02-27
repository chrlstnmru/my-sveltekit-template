<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { fade } from 'svelte/transition';

  import { FormManager, FormValidationError } from '$lib/components/form/form-manager.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as ButtonGroup from '$lib/components/ui/button-group';
  import * as Card from '$lib/components/ui/card';
  import * as Field from '$lib/components/ui/field';
  import { InputNumber } from '$lib/components/ui/input-number';
  import { Switch } from '$lib/components/ui/switch';
  import { useAuth } from '$lib/hooks/use-auth.svelte';
  import {
    remoteGetPasswordPolicy,
    remoteUpdatePasswordPolicy
  } from '$lib/remote/organization.remote';
  import { cn } from '$lib/utils';
  import { PasswordPolicySchema } from '$lib/validators';

  const auth = useAuth();

  const defaultValues = await remoteGetPasswordPolicy({
    organizationId: auth.user?.organizationId
  });

  const form = new FormManager(remoteUpdatePasswordPolicy, {
    schema: PasswordPolicySchema,
    defaultValues,
    usePreflight: true,
    onsuccess: () => {
      toast.success('Password policy updated');
    },
    onfailure: (error) => {
      if (error instanceof FormValidationError) {
        toast.error(error.message);
      } else {
        $inspect(error);
        toast.error('Failed to update password policy');
      }
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

{#snippet SwitchInputField(props: {
  title: string;
  description?: string;
  fieldProps: ReturnType<typeof form.getFieldProps>;
  onValueChange?: (value: any) => void;
  errors?: { message?: string }[];
  hint?: string;
})}
  <Field.Field class="flex-row items-center">
    <div>
      <Field.Label>{props.title}</Field.Label>
      <Field.Description>{props.description}</Field.Description>
    </div>
    <div class="flex max-w-md flex-col items-end justify-end">
      <Switch
        name={props.fieldProps.name}
        aria-invalid={props.fieldProps['aria-invalid']}
        checked={props.fieldProps.checked}
        onCheckedChange={(e) => form.setFieldValue(props.fieldProps.name, e)}
        value={props.fieldProps.value}
      />

      {@render FieldHint({
        hint: props.hint,
        errors: props.errors
      })}
    </div>
  </Field.Field>
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
})}
  <Field.Field class="flex-row items-center">
    <div>
      <Field.Label>{props.title}</Field.Label>
      <Field.Description>{props.description}</Field.Description>
    </div>
    <div class="flex max-w-md flex-col justify-end">
      {#if props.suffix}
        <ButtonGroup.Root class="w-full">
          <InputNumber
            {...props.fieldProps}
            decimalScale={0}
            emptyAsZero
            placeholder={props.placeholder}
          />
          <ButtonGroup.Text class="font-mono font-normal text-muted-foreground">
            {props.suffix}
          </ButtonGroup.Text>
        </ButtonGroup.Root>
      {:else}
        <InputNumber
          {...props.fieldProps}
          emptyAsZero
          formatOnMount
          placeholder={props.placeholder}
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
  <h2 class="mb-6 text-xl font-medium">Password Policy</h2>

  <Card.Root class="pt-5">
    <form {...form.form} {@attach form.enhance}>
      <Field.Group class="gap-0 *:px-5 *:not-first:pt-5 *:not-last:border-b *:not-last:pb-5">
        {@render SwitchInputField({
          title: 'Uppercase',
          description: 'Require at least one uppercase letter',
          fieldProps: form.getFieldProps('requirements.uppercase', 'checkbox'),
          errors: form.getFieldIssues('requirements.uppercase')
        })}

        {@render SwitchInputField({
          title: 'Lowercase',
          description: 'Require at least one lowercase letter',
          fieldProps: form.getFieldProps('requirements.lowercase', 'checkbox'),
          errors: form.getFieldIssues('requirements.lowercase')
        })}

        {@render SwitchInputField({
          title: 'Symbol',
          description: 'Require at least one symbol',
          fieldProps: form.getFieldProps('requirements.symbols', 'checkbox'),
          errors: form.getFieldIssues('requirements.symbols')
        })}

        {@render SwitchInputField({
          title: 'Number',
          description: 'Require at least one number',
          fieldProps: form.getFieldProps('requirements.numbers', 'checkbox'),
          errors: form.getFieldIssues('requirements.numbers')
        })}

        {@render NumberInputField({
          title: 'Minimum Length',
          description: 'Set the minimum length of password',
          fieldProps: { ...form.getFieldProps('minLength', 'text'), min: 8 },
          errors: form.getFieldIssues('minLength'),
          hint: 'Passwords should be at least 8 or more characters',
          suffix: 'characters'
        })}

        {@render NumberInputField({
          title: 'Maximum Password Reuse',
          description: 'Set the maximum number of times a password can be reused',
          fieldProps: form.getFieldProps('preventPasswordReuse', 'text'),
          errors: form.getFieldIssues('preventPasswordReuse'),
          hint: 'Set the value to 0 to disable this feature'
        })}
      </Field.Group>
    </form>

    <Card.Footer class="justify-end gap-4 border-t p-5!">
      {#if isFormTainted}
        <Button
          form={form.formId}
          onclick={() => form.reset()}
          size="sm"
          type="reset"
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
