import React from "react";

/**
 * Row of mutually exclusive options. Used for both time ranges and the
 * dimension a chart is broken down by.
 */
export function SegmentedControl({ label, options, value, onChange, name }) {
  return (
    <div className="stats-control" role="group" aria-label={label}>
      {label ? <span className="stats-control-label">{label}</span> : null}
      <div className="stats-segments">
        {options.map((option) => {
          const optionValue = option.value ?? option;
          const optionLabel = option.label ?? option;
          const selected = optionValue === value;
          return (
            <button
              key={`${name}-${optionValue}`}
              type="button"
              className={`stats-segment${selected ? " is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onChange(optionValue)}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 180, label: "180d" }
];

export function RangeControl({ value, onChange, name }) {
  return (
    <SegmentedControl
      label="Range"
      name={name}
      options={RANGE_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
