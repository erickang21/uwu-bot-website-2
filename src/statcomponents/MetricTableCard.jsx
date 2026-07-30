import React, { useMemo, useState } from "react";
import StatCard from "./StatCard";
import { SegmentedControl } from "./StatsControls";
import { aggregateBy, useStats } from "./useStats";

/**
 * For metrics with several columns that all carry meaning (per-API outcomes,
 * per-command latency). Past a handful of classes a table beats a chart, so this
 * card is table-only by design.
 */
export default function MetricTableCard({
  title,
  description,
  sources,
  columns,
  derive,
  sortKey,
  limit = 20,
  // Roll a multi-day range into one row per dimension value. Omit when the
  // per-day rows are themselves the subject.
  groupBy,
  footnote
}) {
  const [sourceValue, setSourceValue] = useState(sources[0].value);
  const source = sources.find((entry) => entry.value === sourceValue) ?? sources[0];
  const { data, status } = useStats([source.url]);

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    const source = groupBy ? aggregateBy(data, groupBy) : data;
    return source
      .map((row) => derive(row))
      .filter((row) => row)
      .sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0))
      .slice(0, limit);
  }, [data, derive, sortKey, limit, groupBy]);

  const controls =
    sources.length > 1 ? (
      <SegmentedControl
        label="Source"
        name={`${title}-source`}
        options={sources.map(({ value, label }) => ({ value, label }))}
        value={sourceValue}
        onChange={setSourceValue}
      />
    ) : null;

  return (
    <StatCard
      title={title}
      description={description}
      controls={controls}
      status={status}
      isEmpty={!rows.length}
      table={{ columns, rows }}
      footnote={footnote}
      height={200}
      tableOnly
    />
  );
}
