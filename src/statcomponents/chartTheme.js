// Chart tokens for the stats dashboard.
//
// The categorical slots are assigned in fixed order and never cycled, so a
// series keeps its colour when other series are filtered out. Validated against
// the white card surface: 3 slots clear all pairs, 6 clear adjacent pairs. Aqua,
// yellow and magenta sit below 3:1 against the surface, so every chart ships
// either direct labels or the table view alongside it.

export const SURFACE = "#ffffff";
export const PAGE = "#FFF6F1";

export const INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  border: "rgba(11, 11, 11, 0.10)"
};

// Fixed categorical order. Take slots from the front; never reorder per chart.
export const SERIES = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300"
];

// One hue for magnitude comparisons, where colour carries no identity.
export const SINGLE_HUE = SERIES[0];

// Reserved for state, never for a series.
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b"
};

// Two hues that read as opposite, for signed values around zero.
export const DIVERGING = { positive: "#2a78d6", negative: "#d03b3b" };

// The tail of a breakdown folds into one de-emphasised series rather than
// generating a hue past the palette.
export const DE_EMPHASIS = "#a8a7a0";
export const OTHER_LABEL = "Other";

// One slot is held back for "Other", so a breakdown never needs a cycled hue.
export const MAX_SERIES = SERIES.length - 1;

export function seriesColor(index, key) {
  if (key === OTHER_LABEL) return DE_EMPHASIS;
  return SERIES[Math.min(index, SERIES.length - 1)];
}

export function compactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  const absolute = Math.abs(number);
  if (absolute >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
  if (absolute >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
  if (absolute >= 1e4) return `${(number / 1e3).toFixed(1)}k`;
  return Math.round(number).toLocaleString("en-US");
}

export function exactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return Math.round(number).toLocaleString("en-US");
}

export function percent(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${(number * 100).toFixed(digits)}%`;
}

export function milliseconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0ms";
  return number >= 1000 ? `${(number / 1000).toFixed(2)}s` : `${Math.round(number)}ms`;
}

export function signed(value, format = exactNumber) {
  const number = Number(value) || 0;
  if (!number) return "±0";
  return `${number > 0 ? "+" : "−"}${format(Math.abs(number))}`;
}

export function shortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function longDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export const FORMATTERS = { compactNumber, exactNumber, percent, milliseconds };

export const axisProps = {
  tick: { fontSize: 12, fill: INK.muted },
  stroke: INK.axis,
  tickLine: false
};

export const gridProps = {
  stroke: INK.grid,
  strokeDasharray: "0",
  vertical: false
};
