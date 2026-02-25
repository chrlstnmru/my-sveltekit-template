import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  RemoteForm,
  RemoteFormFieldType,
  RemoteFormInput,
  RemoteFormIssue
} from '@sveltejs/kit';

import { untrack } from 'svelte';
import { on } from 'svelte/events';

import type { Path, PathValue } from '$lib/utils';

export type FieldPath<T> = (keyof T & string) | Path<T>;

export type InferRemoteFormInput<T> = T extends RemoteForm<infer Input, any> ? Input : never;
export type InferRemoteFormOutput<T> = T extends RemoteForm<any, infer Output> ? Output : never;

type ValidationStrategy = 'auto' | 'onblur' | 'oninput' | 'onchange' | 'onsubmit';

export type FormOptions<Input extends RemoteFormInput, Output> = {
  schema?: StandardSchemaV1<Input>;
  clearOnSubmit?: boolean;
  validationStrategy?: ValidationStrategy;
  usePreflight?: boolean;
  onsuccess?: (data: Output, formManager: FormManager<RemoteForm<Input, Output>>) => void;
  onfailure?: (
    error: FormValidationError | unknown,
    formManager: FormManager<RemoteForm<any, Output>>
  ) => void;
};

export class FormManager<
  F extends RemoteForm<any, any>,
  Input extends RemoteFormInput = InferRemoteFormInput<F>,
  Output = InferRemoteFormOutput<F>
> {
  private remoteForm: F;
  private htmlForm: HTMLFormElement | null = $state(null);
  private options: Required<FormOptions<Input, Output>>;
  private submitted = $state(false);
  private loading = $state(false);

  constructor(remoteForm: F, options?: FormOptions<Input, Output>) {
    this.options = this.mergeDefaults(options);
    this.remoteForm =
      this.options.schema && this.options.usePreflight
        ? (remoteForm.preflight(this.options.schema) as F)
        : remoteForm;

    if (this.options.usePreflight && !this.options.schema) {
      throw new Error('Schema is required when using preflight');
    }

    this.bindMethods();
  }

  get form() {
    return this.remoteForm.enhance(async ({ data, form, submit }) => {
      try {
        this.submitted = true;
        this.loading = true;
        await submit();

        if (this.options.clearOnSubmit) {
          form.reset();
        }

        const errors = this.errors;
        if (errors?.length > 0) {
          throw new FormValidationError(errors);
        }

        this.options.onsuccess?.(data, this);
      } catch (e) {
        this.options.onfailure?.(e, this);
      } finally {
        this.loading = false;
      }
    });
  }

  get errors() {
    return this.remoteForm.fields.allIssues() ?? [];
  }

  get isSubmitted() {
    return this.submitted;
  }

  get isLoading() {
    return this.loading;
  }

  enhance(formNode: HTMLFormElement) {
    this.htmlForm = formNode;

    const offSubmit = on(formNode, 'submit', () => {
      this.submitted = true;
    });

    const shouldValidate = (strategy: ValidationStrategy) => {
      return this.submitted || this.options.validationStrategy === strategy;
    };

    const handlers = {
      blur: () => {
        if (shouldValidate('onblur')) this.validate();
      },
      input: () => {
        if (shouldValidate('oninput')) this.validate();
      },
      change: () => {
        if (shouldValidate('onchange')) this.validate();
      }
    } as const;

    const strategyEvents: Record<ValidationStrategy, (keyof typeof handlers)[]> = {
      auto: ['blur', 'input', 'change'],
      onblur: ['blur'],
      oninput: ['input'],
      onchange: ['change'],
      onsubmit: []
    };

    const events = strategyEvents[this.options.validationStrategy];
    const cleanups = events.map((type) => {
      const domEvent = type === 'blur' ? 'focusout' : type;
      return on(formNode, domEvent, handlers[type]);
    });

    return () => {
      offSubmit();
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  getFieldProps<P extends FieldPath<Input>, T extends RemoteFormFieldType<PathValue<Input, P>>>(
    field: P,
    type: T
  ) {
    // @ts-expect-error Svelte
    return this.getField(field).as<T>(type);
  }

  getFieldIssues<P extends FieldPath<Input>>(field: P): RemoteFormIssue[] {
    if (this.loading) {
      return [];
    }

    return this.getField(field).issues() ?? [];
  }

  hasFieldIssues<P extends FieldPath<Input>>(field: P): boolean {
    return !this.loading ? this.getFieldIssues(field).length > 0 : false;
  }

  getFieldValue<P extends FieldPath<Input>>(field: P, useUntracked = false): PathValue<Input, P> {
    const value = this.getField(field).value;
    return (useUntracked ? untrack(value) : value()) as PathValue<Input, P>;
  }

  setFieldValue<P extends FieldPath<Input>>(field: P, value: PathValue<Input, P>): void {
    this.getField(field).set(value);
  }

  validate(preflightOnly?: boolean) {
    this.remoteForm.validate({
      preflightOnly: preflightOnly ?? this.options.usePreflight
    });
  }

  reset() {
    this.submitted = false;
    this.loading = false;
    this.htmlForm?.reset();
  }

  protected collectFormData(): Record<string, unknown> {
    return $state.snapshot(this.remoteForm.fields.value());
  }

  protected localValidator() {}

  private bindMethods() {
    this.getFieldProps = this.getFieldProps.bind(this);
    this.getFieldIssues = this.getFieldIssues.bind(this);
    this.getFieldValue = this.getFieldValue.bind(this);
    this.setFieldValue = this.setFieldValue.bind(this);
    this.enhance = this.enhance.bind(this);
    this.reset = this.reset.bind(this);
    this.validate = this.validate.bind(this);
  }

  private getField<P extends FieldPath<Input>>(field: P) {
    const parts = field.split('.') as (keyof Input & string)[];

    if (parts.length === 1) {
      const currentField = this.remoteForm.fields[field as keyof Input & string];
      if (!currentField) {
        throw new Error(`Field "${field}" not found for path "${field}"`);
      }
      return currentField;
    }

    const [head, ...tail] = parts;
    let currentField = this.remoteForm.fields[head];

    if (!currentField) {
      throw new Error(`Field "${head}" not found for path "${field}"`);
    }

    for (const key of tail) {
      currentField = currentField[key];

      if (!currentField) {
        throw new Error(`Field "${key}" not found for path "${field}"`);
      }
    }

    return currentField;
  }

  private mergeDefaults(
    options?: FormOptions<Input, Output>
  ): Required<FormOptions<Input, Output>> {
    return {
      clearOnSubmit: false,
      usePreflight: true,
      validationStrategy: 'auto',
      schema: undefined as any,
      onsuccess: undefined as any,
      onfailure: undefined as any,
      ...options
    };
  }
}

export class FormValidationError extends Error {
  readonly issues: ReadonlyArray<{ message: string; path?: (string | number)[] }>;

  constructor(issues: Array<{ message: string; path?: (string | number)[] }>) {
    super('Form validation failed');
    this.name = 'FormValidationError';
    this.issues = issues;
    Error.captureStackTrace?.(this, FormValidationError);
  }
}
