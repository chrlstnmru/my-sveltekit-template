import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { RemoteForm, RemoteFormFieldType, RemoteFormIssue } from '@sveltejs/kit';

import { untrack } from 'svelte';
import { on } from 'svelte/events';

type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${Path<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type FieldPath<T> = (keyof T & string) | Path<T>;

export type InferRemoteFormInput<T> = T extends RemoteForm<infer Input, any> ? Input : never;
export type InferRemoteFormOutput<T> = T extends RemoteForm<any, infer Output> ? Output : never;

type ValidationStrategy = 'auto' | 'onblur' | 'oninput' | 'onchange' | 'onsubmit';

export type FormOptions<Input, Output> = {
  schema?: StandardSchemaV1<Input>;
  clearOnSubmit?: boolean;
  validationStrategy?: ValidationStrategy;
  usePreflight?: boolean;
  onsuccess?: (data: Output, formManager: FormManager<RemoteForm<any, Output>>) => void;
  onfailure?: (
    error: FormValidationError | unknown,
    formManager: FormManager<RemoteForm<any, Output>>
  ) => void;
};

export class FormManager<
  F extends RemoteForm<any, Output>,
  Input = InferRemoteFormInput<F>,
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

  getFieldProps<K extends keyof Input & string, T extends RemoteFormFieldType<Input[K]>>(
    field: K,
    type: T
  ) {
    const inputField = this.remoteForm.fields[field];
    // @ts-expect-error Svelte
    const props = $derived(inputField.as<T>(type));
    return { ...props, 'aria-invalid': this.hasFieldIssues(field) };
  }

  getFieldIssues<P extends FieldPath<Input>>(field: P): RemoteFormIssue[] {
    const directField = this.remoteForm.fields[field as keyof Input & string];

    if (this.loading) {
      return [];
    }

    if (directField) {
      return directField.issues() ?? [];
    }

    if (field.includes('.')) {
      return this.getNestedIssues(field);
    }

    return [];
  }

  hasFieldIssues<P extends FieldPath<Input>>(field: P): boolean {
    return !this.loading ? this.getFieldIssues(field).length > 0 : false;
  }

  getFieldValue<P extends FieldPath<Input>>(field: P, useUntracked = false): PathValue<Input, P> {
    if (!field.includes('.')) {
      const value = this.remoteForm.fields[field as keyof Input & string].value;
      return (useUntracked ? untrack(value) : value()) as PathValue<Input, P>;
    }

    return this.getNestedValue(field, useUntracked) as PathValue<Input, P>;
  }

  setFieldValue<P extends FieldPath<Input>>(field: P, value: PathValue<Input, P>): void {
    if (!field.includes('.')) {
      this.remoteForm.fields[field as keyof Input & string].set(value);
      return;
    }

    this.setNestedValue(field, value);
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

  private getNestedIssues(dotPath: string): RemoteFormIssue[] {
    const allIssues = this.remoteForm.fields.allIssues() ?? [];
    return allIssues.filter((issue) => issue.path?.join('.') === dotPath);
  }

  private getNestedValue(dotPath: string, useUntracked = false): unknown {
    const [head, ...tail] = dotPath.split('.');
    let current: unknown = this.getFieldValue(head as keyof Input & string, useUntracked);

    for (const key of tail) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }

  private setNestedValue(dotPath: string, value: unknown): void {
    const [parentKey, ...childPath] = dotPath.split('.');
    const parent = this.getFieldValue(parentKey as keyof Input & string, true);

    if (parent === null || typeof parent !== 'object') {
      throw new Error(`Cannot set nested property on non-object field: ${parentKey}`);
    }

    const updated = this.deepSet(parent as Record<string, unknown>, childPath, value);
    this.setFieldValue(parentKey as keyof Input & string, updated as any);
  }

  private deepSet(
    obj: Record<string, unknown>,
    path: string[],
    value: unknown
  ): Record<string, unknown> {
    const [head, ...tail] = path;

    if (tail.length === 0) {
      return { ...obj, [head]: value };
    }

    return {
      ...obj,
      [head]: this.deepSet((obj[head] as Record<string, unknown>) ?? {}, tail, value)
    };
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
