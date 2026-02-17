import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { RemoteForm, RemoteFormFieldType } from '@sveltejs/kit';

import { untrack } from 'svelte';
import { on } from 'svelte/events';

type InferRemoteFormInput<T> = T extends RemoteForm<infer Input, any> ? Input : never;
type InferRemoteFormOutput<T> = T extends RemoteForm<any, infer Output> ? Output : never;

type FormValidationStrategy = 'auto' | 'onblur' | 'oninput' | 'onchange' | 'onsubmit';

type FormManagerOptions<Input, Output> = {
  schema?: StandardSchemaV1<Input>;
  clearOnSubmit?: boolean;
  validationStrategy?: FormValidationStrategy;
  usePreflight?: boolean;
  onsuccess?: (data: Output) => void;
  onfailure?: (error: unknown) => void;
};

export class FormManager<
  F extends RemoteForm<any, Output>,
  Input = InferRemoteFormInput<F>,
  Output = InferRemoteFormOutput<F>,
> {
  #remoteForm: F;
  #opts: Required<FormManagerOptions<Input, Output>>;
  #isSubmitted = $state(false);

  constructor(remoteForm: F, opts?: FormManagerOptions<Input, Output>) {
    this.#opts = this.#parseOptions(opts);
    this.#remoteForm =
      this.#opts.schema && this.#opts.usePreflight
        ? (remoteForm.preflight(this.#opts.schema) as F)
        : remoteForm;

    if (this.#opts.usePreflight && !this.#opts.schema) {
      throw new Error('Schema is required when using preflight');
    }

    // Bind methods to preserve context
    this.getFieldProps = this.getFieldProps.bind(this);
    this.getFieldIssues = this.getFieldIssues.bind(this);
    this.getFieldValue = this.getFieldValue.bind(this);
    this.setFieldValue = this.setFieldValue.bind(this);
    this.enhance = this.enhance.bind(this);
    this.reset = this.reset.bind(this);
    this.validate = this.validate.bind(this);
  }

  get form() {
    const form = this.#remoteForm;
    const opts = this.#opts;

    return form.enhance(async ({ data, form, submit }) => {
      try {
        this.#isSubmitted = true;
        await submit();

        if (opts.clearOnSubmit) {
          form.reset();
        }

        const errors = this.errors;
        if (errors && errors.length > 0) {
          throw new FormValidationError(errors);
        }

        opts.onsuccess?.(data);
      } catch (e: unknown) {
        opts.onfailure?.(e);
      }
    });
  }

  get errors() {
    return this.#remoteForm.fields.allIssues();
  }

  get isSubmitted() {
    return this.#isSubmitted;
  }

  enhance(formNode: HTMLFormElement) {
    const form = this.#remoteForm;
    const { validationStrategy, usePreflight } = this.#opts;

    const offSubmit = on(formNode, 'submit', () => {
      this.#isSubmitted = true;
    });

    const shouldValidate = (strategy: FormValidationStrategy) => {
      return this.#isSubmitted || validationStrategy === strategy;
    };

    const handlers = {
      blur: () => {
        if (shouldValidate('onblur')) {
          form.validate({ preflightOnly: usePreflight });
        }
      },
      input: () => {
        if (shouldValidate('oninput')) {
          form.validate({ preflightOnly: usePreflight });
        }
      },
      change: () => {
        if (shouldValidate('onchange')) {
          form.validate({ preflightOnly: usePreflight });
        }
      },
    } as const;

    // Map strategies to corresponding DOM events
    const strategyEvents: Record<FormValidationStrategy, (keyof typeof handlers)[]> = {
      auto: ['blur', 'input', 'change'],
      onblur: ['blur'],
      oninput: ['input'],
      onchange: ['change'],
      onsubmit: [],
    };

    const events = strategyEvents[validationStrategy];
    const cleanups = events.map((eventType) => {
      const domEvent = eventType === 'blur' ? 'focusout' : eventType;
      return on(formNode, domEvent, handlers[eventType]);
    });

    return () => {
      offSubmit();
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  /**
   * Get the HTML Input props for a field
   *
   * @param field Field name
   * @param type Field type
   * @returns HTML Input props for the specified field
   */
  getFieldProps<K extends keyof Input & string, T extends RemoteFormFieldType<Input[K]>>(
    field: K,
    type: T
  ) {
    const inputField = this.#remoteForm.fields[field];
    // @ts-expect-error - Type inference limitation with RemoteForm fields
    return inputField.as<T>(type);
  }

  /**
   * Get the issues for a field
   *
   * @param field Field name
   * @returns An array of issues for the field
   */
  getFieldIssues(field: keyof Input & string) {
    return this.#remoteForm.fields[field].issues() ?? [];
  }

  /**
   * Check if a field has any issues
   *
   * @param field Field name
   * @returns True if the field has issues
   */
  hasFieldIssues(field: keyof Input & string): boolean {
    const issues = this.getFieldIssues(field);
    return issues.length > 0;
  }

  /**
   * Get the value of a field
   *
   * @param field Field name
   * @param untracked If true, the value will not be reactive
   * @returns The value of the field
   */
  getFieldValue(field: keyof Input & string, untracked: boolean = false) {
    const fieldValue = this.#remoteForm.fields[field].value;
    return untracked ? untrack(fieldValue) : fieldValue();
  }

  /**
   * Set the value of a field
   *
   * @param field Field name
   * @param value Field value
   */
  setFieldValue(field: keyof Input & string, value: Input[typeof field]) {
    this.#remoteForm.fields[field].set(value);
  }

  /**
   * Manually trigger form validation
   *
   * @param preflightOnly If true, only run preflight validation
   */
  validate(preflightOnly?: boolean) {
    this.#remoteForm.validate({
      preflightOnly: preflightOnly ?? this.#opts.usePreflight,
    });
  }

  /**
   * Reset the form state
   */
  reset() {
    this.#isSubmitted = false;
  }

  /**
   * Parse and merge options with defaults
   */
  #parseOptions(
    opts?: FormManagerOptions<Input, Output>
  ): Required<FormManagerOptions<Input, Output>> {
    const defaults: Required<FormManagerOptions<Input, Output>> = {
      clearOnSubmit: false,
      usePreflight: true,
      validationStrategy: 'auto',
      schema: undefined as any,
      onsuccess: undefined as any,
      onfailure: undefined as any,
    };

    if (!opts) return defaults;

    return {
      ...defaults,
      ...Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined)),
    } as Required<FormManagerOptions<Input, Output>>;
  }
}

export class FormValidationError extends Error {
  readonly issues: ReadonlyArray<{ message: string; path?: (string | number)[] }>;

  constructor(issues: Array<{ message: string; path?: (string | number)[] }>) {
    super('Form validation failed');
    this.name = 'FormValidationError';
    this.issues = issues;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FormValidationError);
    }
  }
}
