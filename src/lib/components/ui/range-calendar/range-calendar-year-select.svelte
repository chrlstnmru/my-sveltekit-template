<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';

  import type { WithoutChildrenOrChild } from '$lib/utils.js';

  import { cn } from '$lib/utils.js';

  let {
    ref = $bindable(null),
    class: className,
    value,
    ...restProps
  }: WithoutChildrenOrChild<RangeCalendarPrimitive.YearSelectProps> = $props();
</script>

<span
  class={cn(
    'relative flex rounded-md border border-input shadow-xs has-focus:border-ring has-focus:ring-[3px] has-focus:ring-ring/50',
    className
  )}
>
  <RangeCalendarPrimitive.YearSelect class="absolute inset-0 opacity-0" bind:ref {...restProps}>
    {#snippet child({ props, yearItems, selectedYearItem })}
      <select {...props} {value}>
        {#each yearItems as yearItem (yearItem.value)}
          <option
            selected={value !== undefined
              ? yearItem.value === value
              : yearItem.value === selectedYearItem.value}
            value={yearItem.value}
          >
            {yearItem.label}
          </option>
        {/each}
      </select>
      <span
        class="flex h-8 items-center gap-1 rounded-md ps-2 pe-1 text-sm font-medium select-none [&>svg]:size-3.5 [&>svg]:text-muted-foreground"
        aria-hidden="true"
      >
        {yearItems.find((item) => item.value === value)?.label || selectedYearItem.label}
        <ChevronDownIcon class="size-4" />
      </span>
    {/snippet}
  </RangeCalendarPrimitive.YearSelect>
</span>
