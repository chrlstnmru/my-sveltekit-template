import type { StandardSchemaV1, StandardTypedV1 } from '@standard-schema/spec';
import type {
  RemoteForm,
  RemoteFormFieldType,
  RemoteFormInput,
  RemoteFormIssue
} from '@sveltejs/kit';

import { tick, untrack } from 'svelte';
import { on } from 'svelte/events';
import { SvelteSet } from 'svelte/reactivity';

import type { PartialAll, Path, PathValue } from '$lib/utils';

import { beforeNavigate } from '$app/navigation';

/** Global list of warned forms */
const warnedForms = new SvelteSet<string>();

/** Global form warning state */
let globalWarningActive = $state(false);

export type FieldPath<T> = (keyof T & string) | Path<T>;

export type InferRemoteFormInput<T> = T extends RemoteForm<infer Input, any> ? Input : never;
export type InferRemoteFormOutput<T> = T extends RemoteForm<any, infer Output> ? Output : never;

type ValidationStrategy = 'auto' | 'onblur' | 'oninput' | 'onchange' | 'onsubmit';

type AsType<
  I extends StandardTypedV1.InferInput<StandardSchemaV1>,
  P extends string
> = RemoteFormFieldType<PathValue<Required<I>, P>>;

export type FormOptions<Input extends RemoteFormInput, Output> = {
  /** Unique identifier for the form */
  id?: string;
  schema?: StandardSchemaV1<Input>;
  defaultValues?: PartialAll<StandardSchemaV1.InferInput<StandardSchemaV1<Input>>>;
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

  private initialValues = $state<Record<string, unknown>>({});
  private taintedFields = new SvelteSet<string>();

  private tainted = $derived(this.taintedFields.size > 0);

  private fieldErrorFocused = $state(false);

  constructor(remoteForm: F, options?: FormOptions<Input, Output>) {
    this.options = this.mergeDefaults(options);
    this.remoteForm =
      this.options.schema && this.options.usePreflight
        ? (remoteForm.preflight(this.options.schema) as F)
        : remoteForm;

    if (this.options.usePreflight && !this.options.schema) {
      throw new Error('Schema is required when using preflight');
    }

    this.captureInitialValues();

    $effect(() => {
      if (this.errors.length > 0 && !this.fieldErrorFocused) {
        queueMicrotask(async () => {
          await tick();

          const elem = this.htmlForm?.querySelector('[aria-invalid="true"]');
          // @ts-expect-error HTMLElement have this
          elem?.focus();
          this.fieldErrorFocused = true;
        });
      }
    });

    $effect(() => {
      const currentValues = $state.snapshot(this.fields);
      untrack(() => {
        this.updateAllTaintedFields(currentValues);
      });
    });

    beforeNavigate(({ cancel }) => {
      if (!this.tainted || this.remoteForm.pending) return;
      if (warnedForms.has(this.options.id)) return;
      if (!this.shouldShowTaintedWarning()) return;

      // TODO: Use alert dialog instead
      // eslint-disable-next-line no-alert
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');

      if (!confirm) {
        cancel();
      }

      warnedForms.add(this.options.id);
      globalWarningActive = true;

      queueMicrotask(() => {
        warnedForms.clear();
        globalWarningActive = false;
      });
    });

    this.bindMethods();
  }

  get form() {
    const enhancedForm = this.remoteForm.enhance(async ({ data, form, submit }) => {
      try {
        // @ts-expect-error HTMLElement have this
        document.activeElement?.blur();

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
        this.captureInitialValues(data);
        this.clearTainted();
      } catch (e) {
        this.options.onfailure?.(e, this);
      } finally {
        this.loading = false;
      }
    });

    return {
      id: this.options.id,
      ...enhancedForm
    };
  }

  get fields() {
    return this.remoteForm.fields.value();
  }

  get errors() {
    return this.remoteForm.fields.allIssues() ?? [];
  }

  get isSubmitted() {
    return this.submitted;
  }

  get isLoading() {
    const loading = this.loading || this.remoteForm.pending > 0;
    return loading;
  }

  get isTainted() {
    return this.tainted;
  }

  get formId() {
    return this.options.id;
  }

  enhance(formNode: HTMLFormElement) {
    this.htmlForm = formNode;

    const offSubmit = on(formNode, 'submit', async () => {
      this.submitted = true;
      this.fieldErrorFocused = false;
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

  getFieldProps<P extends FieldPath<Required<Input>>, T extends AsType<Input, P>>(
    field: P,
    type: T
  ) {
    // @ts-expect-error Svelte
    const formField: any = this.getField(field).as<T>(type);

    return {
      ...formField,
      name: field,
      'aria-invalid': !this.loading && formField['aria-invalid'] === 'true'
    } as typeof formField;
  }

  getFieldIssues<P extends FieldPath<Required<Input>>>(field: P): RemoteFormIssue[] {
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

  isFieldTainted<P extends FieldPath<Input>>(field: P): boolean {
    return this.taintedFields.has(field as string);
  }

  validate(preflightOnly?: boolean) {
    this.remoteForm.validate({
      preflightOnly: preflightOnly ?? this.options.usePreflight,
      includeUntouched: true
    });
  }

  reset() {
    this.submitted = false;
    this.loading = false;
    this.clearTainted();
    this.captureInitialValues();
  }

  clear() {
    this.reset();
    this.htmlForm?.reset();
  }

  protected collectFormData(): Record<string, unknown> {
    return $state.snapshot(this.remoteForm.fields.value());
  }

  protected localValidator() {}

  private generateId() {
    return `form-${Math.random().toString(36).substring(2, 9)}`;
  }

  private bindMethods() {
    this.getFieldProps = this.getFieldProps.bind(this);
    this.getFieldIssues = this.getFieldIssues.bind(this);
    this.getFieldValue = this.getFieldValue.bind(this);
    this.setFieldValue = this.setFieldValue.bind(this);
    this.enhance = this.enhance.bind(this);
    this.reset = this.reset.bind(this);
    this.validate = this.validate.bind(this);
    this.clear = this.clear.bind(this);
    this.isFieldTainted = this.isFieldTainted.bind(this);
    this.clearTainted = this.clearTainted.bind(this);
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

  private captureInitialValues(data?: Input) {
    this.remoteForm.fields.set(data ?? this.options.defaultValues ?? {});
    this.initialValues = data ?? $state.snapshot(this.remoteForm.fields.value());
  }

  private getInitialValueForPath(path: string): unknown {
    const parts = path.split('.');
    let value: unknown = this.initialValues;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  private updateAllTaintedFields(currentValues: Record<string, unknown>, path = ''): void {
    const entries = Object.entries(currentValues ?? {});

    if (entries.length === 0) return;

    for (const [key, value] of entries) {
      const currentPath = path ? `${path}.${key}` : key;
      const initialValue = this.getInitialValueForPath(currentPath);

      if (this.isObject(value) && this.isObject(initialValue)) {
        // Recurse into nested objects
        this.updateAllTaintedFields(value as Record<string, unknown>, currentPath);
      } else {
        const isDifferent = !this.deepEqual(initialValue, value);

        if (isDifferent) {
          this.taintedFields.add(currentPath);
        } else {
          this.taintedFields.delete(currentPath);
        }
      }
    }

    if (!path) {
      // Cleanup tainted markers for non-existing fields
      this.cleanupOrphanedTaintedFields(currentValues);
    }
  }

  private clearTainted() {
    this.taintedFields.clear();
  }

  private shouldShowTaintedWarning() {
    if (globalWarningActive) {
      return false;
    }

    return true;
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
      defaultValues: undefined as any,
      id: this.generateId(),
      ...options
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'number' && Number.isNaN(a as number) && Number.isNaN(b as number))
      return true;

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;

      const keysA = Object.keys(a as object);
      const keysB = Object.keys(b as object);
      const keysSetB = new Set(keysB);

      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysSetB.has(key)) return false;
        if (
          !this.deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        ) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  private cleanupOrphanedTaintedFields(currentValues: Record<string, unknown>): void {
    // Remove tainted markers for fields that no longer exist
    for (const taintedPath of this.taintedFields) {
      if (!this.pathExistsInObject(taintedPath, currentValues)) {
        this.taintedFields.delete(taintedPath);
      }
    }
  }

  private pathExistsInObject(path: string, obj: Record<string, unknown>): boolean {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined || !(part in (current as object))) {
        return false;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return true;
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
