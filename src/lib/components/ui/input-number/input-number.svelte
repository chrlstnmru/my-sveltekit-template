<!-- number-input.svelte -->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  import { tick } from 'svelte';

  import type { WithElementRef } from '$lib/utils';

  import { Input } from '$lib/components/ui/input';

  type Props = {
    value?: number | null;
    onblur?: (value: number | null) => void;
    onchange?: (value: number | null) => void;
    oninput?: (value: number | null) => void;
    format?: 'number' | 'currency' | 'percent' | 'custom';
    locale?: string;
    min?: number;
    max?: number;
    step?: number;
    decimalScale?: number;
    thousandSeparator?: boolean | string;
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
    allowNegative?: boolean;
    allowDecimal?: boolean;
    fixedDecimalScale?: boolean;
    updateStrategy?: 'onblur' | 'oninput' | 'both';
    formatOnMount?: boolean;
    emptyAsZero?: boolean;
  } & WithElementRef<
    Omit<HTMLInputAttributes, 'value' | 'oninput' | 'onchange' | 'onblur' | 'type' | 'files'>,
    HTMLInputElement
  >;

  let {
    ref = $bindable(null),
    value = $bindable(null),
    onblur,
    onchange,
    oninput,
    format = 'number',
    locale = 'en-US',
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    decimalScale = 2,
    thousandSeparator = true,
    decimalSeparator = '.',
    prefix = '',
    suffix = '',
    allowNegative = true,
    allowDecimal = true,
    fixedDecimalScale = false,
    class: className = '',
    updateStrategy = 'both',
    formatOnMount = false,
    emptyAsZero = false,
    step = 1,
    ...rest
  }: Props = $props();

  let displayValue = $state('');
  let isFocused = $state(false);
  let isMounted = $state(false);

  // Determine separators based on locale if not explicitly provided
  const getSeparators = () => {
    if (thousandSeparator !== true) {
      return {
        thousand: typeof thousandSeparator === 'string' ? thousandSeparator : ',',
        decimal: decimalSeparator
      };
    }

    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    const thousand = parts.find((p) => p.type === 'group')?.value || ',';
    const decimal = parts.find((p) => p.type === 'decimal')?.value || '.';

    return { thousand, decimal };
  };

  const { thousand: THOUSAND_SEP, decimal: DECIMAL_SEP } = getSeparators();

  const formatNumber = (number: number | null, forEditing = false): string => {
    let num = number;

    if (num === null || num === undefined || Number.isNaN(num)) {
      if (emptyAsZero) num = 0;
      else return '';
    }

    // When focused for editing, show raw number without formatting
    if (forEditing) {
      return String(num);
    }

    const isNegative = num < 0;
    const absNum = Math.abs(num);

    // Handle decimal scaling
    let formatted = absNum.toFixed(decimalScale);

    if (!fixedDecimalScale) {
      // Remove trailing zeros
      formatted = formatted.replace(/\.?0+$/, '');
    }

    // Split integer and decimal parts
    const [intPart, decPart] = formatted.split('.');

    // Add thousand separators
    const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEP);

    // Reconstruct
    let result = withSeparators;
    if (decPart && allowDecimal) {
      result += DECIMAL_SEP + decPart;
    }

    // Add prefix/suffix and sign
    if (isNegative && allowNegative) {
      result = `-${result}`;
    }

    return prefix + result + suffix;
  };

  const parseValue = (str: string, shouldRound: boolean = true): number | null => {
    if (!str || str === prefix || str === suffix || str.trim() === '') return null;

    // Remove prefix and suffix
    let clean = str;
    if (prefix && clean.startsWith(prefix)) {
      clean = clean.slice(prefix.length);
    }
    if (suffix && clean.endsWith(suffix)) {
      clean = clean.slice(0, -suffix.length);
    }

    // Remove thousand separators
    const thousandRegex = new RegExp(`\\${THOUSAND_SEP}`, 'g');
    clean = clean.replace(thousandRegex, '');

    // Replace decimal separator with standard dot
    clean = clean.replace(DECIMAL_SEP, '.');

    // Handle negative
    const isNegative = clean.startsWith('-');
    if (isNegative) {
      clean = clean.slice(1);
      if (!allowNegative) return null;
    }

    // Parse
    let num = Number.parseFloat(clean);
    if (Number.isNaN(num)) return null;

    // Round to nearest decimal scale
    if (shouldRound) {
      const factor = 10 ** decimalScale;
      num = Math.round(num * factor) / factor;
    }

    const finalNum = isNegative ? -num : num;

    // Apply min/max constraints
    if (finalNum < min) return min;
    if (finalNum > max) return max;

    return finalNum;
  };

  const updateValue = async (newValue: number | null) => {
    value = newValue;
    displayValue = isFocused ? String(newValue ?? '') : formatNumber(newValue);

    await tick();

    // Call callbacks
    oninput?.(newValue);
    if (updateStrategy === 'oninput' || updateStrategy === 'both') {
      onchange?.(newValue);
    }
  };

  // Sync external value changes to display
  $effect(() => {
    if (!isFocused) {
      const newDisplay = formatNumber(value);

      if (!isMounted) {
        displayValue = formatOnMount ? newDisplay : '';
        isMounted = true;
      } else {
        if (newDisplay !== displayValue) {
          displayValue = newDisplay;
        }
      }
    }
  });

  // Handle input with cursor preservation
  const handleBeforeInput = (e: InputEvent) => {
    const input = e.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    // Prevent multiple decimal separators
    if (e.data === DECIMAL_SEP || e.data === '.') {
      const currentValue = input.value;
      const decimalIndex = currentValue.indexOf(DECIMAL_SEP);
      if (decimalIndex !== -1 && (start > decimalIndex || end <= decimalIndex)) {
        e.preventDefault();
        return;
      }
      if (!allowDecimal) {
        e.preventDefault();
        return;
      }
    }

    // Prevent negative sign in middle or multiple negatives
    if (e.data === '-') {
      if (!allowNegative || start !== 0 || input.value.includes('-')) {
        e.preventDefault();
        return;
      }
    }

    // Prevent invalid characters
    if (e.data && !/[\d.\-]/.test(e.data)) {
      const isSeparator = e.data === THOUSAND_SEP || e.data === DECIMAL_SEP;
      const isPrefix = prefix.includes(e.data);
      const isSuffix = suffix.includes(e.data);

      if (!isSeparator && !isPrefix && !isSuffix) {
        e.preventDefault();
      }
    }
  };

  const handleInput = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const rawValue = input.value;
    const selectionStart = input.selectionStart || 0;

    updateValue(parseValue(rawValue, false));

    // Smart cursor positioning
    if (ref && document.activeElement === ref) {
      const newCursor = Math.min(selectionStart, rawValue.length);
      ref.setSelectionRange(newCursor, newCursor);
    }
  };

  const handleBlur = async (e: FocusEvent) => {
    isFocused = false;

    const input = e.target as HTMLInputElement;
    const rawValue = input.value;

    // Parse and format for display
    const newNum = parseValue(rawValue, true);
    const newDisplay = formatNumber(newNum);

    displayValue = newDisplay;
    value = newNum;

    await tick();

    if (updateStrategy === 'onblur' || updateStrategy === 'both') {
      onblur?.(newNum);
      onchange?.(newNum);
    }
  };

  const handleFocus = () => {
    isFocused = true;

    // Show unformatted value for editing
    if (value !== null && !Number.isNaN(value)) {
      displayValue = String(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Allow: backspace, delete, tab, escape, enter
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
      return;
    }

    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }

    // Allow: home, end, left, right
    if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentValue = value ?? 0;
      const newValue = Math.min(currentValue + parseValue(String(step))!, max);
      updateValue(newValue);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentValue = value ?? 0;
      const newValue = Math.max(currentValue - parseValue(String(step))!, min);
      updateValue(newValue);
      return;
    }

    // Allow: minus at start if negative allowed
    if (e.key === '-' && allowNegative) {
      const input = e.target as HTMLInputElement;
      if (input.selectionStart === 0 && !input.value.includes('-')) {
        return;
      }
    }

    // Allow: decimal separator
    if ((e.key === DECIMAL_SEP || e.key === '.') && allowDecimal) {
      const input = e.target as HTMLInputElement;
      const val = input.value;
      if (!val.replace(prefix, '').replace(suffix, '').includes(DECIMAL_SEP)) {
        return;
      }
    }

    // Allow: digits
    if (/\d/.test(e.key)) {
      return;
    }

    // Prevent everything else
    e.preventDefault();
  };

  // Apply preset formats
  $effect(() => {
    if (format === 'currency' && !prefix && !suffix) {
      prefix = '$';
    } else if (format === 'percent' && !suffix) {
      suffix = '%';
    }
  });
</script>

<Input
  class={className}
  inputmode="decimal"
  onbeforeinput={handleBeforeInput}
  onblur={handleBlur}
  onfocus={handleFocus}
  oninput={handleInput}
  onkeydown={handleKeyDown}
  type="text"
  value={displayValue}
  bind:ref
  {...rest}
/>

<input name={rest.name} type="hidden" {value} />
