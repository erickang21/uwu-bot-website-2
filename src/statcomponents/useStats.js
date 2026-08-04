import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_SERIES, OTHER_LABEL } from "./chartTheme";

/**
 * Fetches the first candidate URL that responds. Metric endpoints are served by
 * a separate API, so a card whose endpoint has not shipped yet reports "not
 * available" instead of breaking the page, and charts that have an older
 * single-purpose endpoint can fall back to it.
 */
export function useStats(urls, { enabled = true } = {}) {
  const candidates = useMemo(
    () => (Array.isArray(urls) ? urls : [urls]).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(urls)]
  );

  const [state, setState] = useState({ data: null, status: "idle", error: null });

  const load = useCallback(async () => {
    if (!enabled || !candidates.length) return;
    setState({ data: null, status: "loading", error: null });

    let lastError = null;
    for (const url of candidates) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          lastError = new Error(`${url} responded ${response.status}`);
          continue;
        }
        const payload = await response.json();
        setState({ data: payload, status: "ready", error: null });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setState({ data: null, status: "error", error: lastError });
  }, [candidates, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function dailyUrl(type, days) {
  return `/api/stats/daily?type=${encodeURIComponent(type)}&days=${days}`;
}

export function lifetimeUrl(type) {
  return `/api/stats/lifetime?type=${encodeURIComponent(type)}`;
}

/**
 * Turns one-row-per-(date, dimension) records into one row per date with a
 * column per series, keeping the largest series by total and folding the rest
 * into "Other" so colour slots are never cycled.
 */
export function pivotByDimension(rows, { dimension, valueField = "count", limit = MAX_SERIES }) {
  const totals = new Map();
  for (const row of rows) {
    const key = String(row[dimension] ?? "unknown");
    totals.set(key, (totals.get(key) ?? 0) + (Number(row[valueField]) || 0));
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const kept = ranked.slice(0, limit).map(([key]) => key);
  const keptSet = new Set(kept);
  const hasOther = ranked.length > kept.length;

  const byDate = new Map();
  for (const row of rows) {
    const date = row.date;
    if (!byDate.has(date)) byDate.set(date, { date });
    const bucket = byDate.get(date);
    const key = String(row[dimension] ?? "unknown");
    const series = keptSet.has(key) ? key : OTHER_LABEL;
    bucket[series] = (bucket[series] ?? 0) + (Number(row[valueField]) || 0);
  }

  const series = hasOther ? [...kept, OTHER_LABEL] : kept;
  const data = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));

  // Recharts needs every key present on every row for stacking to line up.
  for (const row of data) {
    for (const key of series) if (row[key] === undefined) row[key] = 0;
  }

  return { data, series };
}

/**
 * Collapses rows that share a date into a single row, summing the given fields.
 */
export function foldByDate(rows, fields) {
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date });
    const bucket = byDate.get(row.date);
    for (const field of fields) {
      bucket[field] = (bucket[field] ?? 0) + (Number(row[field]) || 0);
    }
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Counters that represent a high-water mark, not a total, so they combine with
// max rather than sum when several days are rolled together.
export const MAX_FIELDS = ["maxMs", "maxCpuPercent", "maxMemRssMb", "maxDays"];

/**
 * Rolls several days of rows into one row per dimension value. Without this a
 * multi-day range lists the same command or permission once per day.
 */
export function aggregateBy(rows, key) {
  const grouped = new Map();

  for (const row of rows) {
    const id = String(row[key] ?? "unknown");
    if (!grouped.has(id)) grouped.set(id, { [key]: row[key] });
    const target = grouped.get(id);

    for (const [field, value] of Object.entries(row)) {
      if (field === key || field === "date" || field === "type") continue;
      if (typeof value !== "number") continue;
      if (MAX_FIELDS.includes(field)) {
        target[field] = Math.max(target[field] ?? -Infinity, value);
      } else {
        target[field] = (target[field] ?? 0) + value;
      }
    }
  }

  return [...grouped.values()];
}

export function rankBy(rows, { key, valueField = "count", limit = 15, orderBy = "value" }) {
  const mapped = aggregateBy(rows, key)
    .map((row) => ({ label: String(row[key] ?? "unknown"), value: Number(row[valueField]) || 0 }))
    .filter((row) => row.value !== 0);

  if (orderBy === "label") {
    return mapped.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }
  return mapped.sort((a, b) => b.value - a.value).slice(0, limit);
}

export const LATENCY_BUCKETS = [100, 250, 500, 1000, 3000, 10000];

/**
 * Percentile from the stored latency bucket counters, mirroring how the bot and
 * the API estimate it: interpolate within the bucket the percentile lands in.
 * Using the bucket's upper edge instead reports a p95 above the slowest run
 * recorded whenever a command's runs sit just past a boundary.
 */
export function approximatePercentile(row, percentile = 0.95) {
  const total = Number(row.count) || 0;
  if (!total) return 0;

  const maxMs = Number(row.maxMs) || 0;
  const target = total * percentile;
  let cumulative = 0;
  let lowerEdge = 0;

  for (const bucket of LATENCY_BUCKETS) {
    const inBucket = Number(row[`le${bucket}`]) || 0;
    if (cumulative + inBucket >= target) {
      const upperEdge = maxMs > 0 ? Math.min(bucket, maxMs) : bucket;
      const fraction = inBucket > 0 ? (target - cumulative) / inBucket : 1;
      const estimate = lowerEdge + Math.max(upperEdge - lowerEdge, 0) * fraction;
      return maxMs > 0 ? Math.min(estimate, maxMs) : estimate;
    }
    cumulative += inBucket;
    lowerEdge = bucket;
  }

  return maxMs;
}

export function foldTotals(rows, fields) {
  const totals = {};
  for (const row of rows) {
    for (const field of fields) {
      totals[field] = (totals[field] ?? 0) + (Number(row[field]) || 0);
    }
  }
  return totals;
}
