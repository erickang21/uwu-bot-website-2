import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StatCard from "./StatCard";
import { SegmentedControl } from "./StatsControls";
import { rankBy, useStats } from "./useStats";
import {
  axisProps,
  compactNumber,
  exactNumber,
  INK,
  SINGLE_HUE
} from "./chartTheme";

function BarTooltip({ active, payload, format }) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="stats-tooltip">
      <div className="stats-tooltip-title">{row.payload.label}</div>
      <div className="stats-tooltip-row">
        <span className="stats-tooltip-swatch" style={{ background: SINGLE_HUE }} />
        <span className="stats-tooltip-value">{format(row.value)}</span>
      </div>
    </div>
  );
}

/**
 * Ranked magnitude comparison. Colour carries no identity here, so every bar is
 * the same hue — a per-bar palette would double-encode length as colour.
 */
export default function BreakdownCard({
  title,
  description,
  sources,
  limit = 12,
  format = compactNumber,
  valueLabel = "Uses",
  orderBy = "value",
  footnote
}) {
  const [sourceValue, setSourceValue] = useState(sources[0].value);
  const source = sources.find((entry) => entry.value === sourceValue) ?? sources[0];

  const { data, status } = useStats(
    source.fallbackUrl ? [source.url, source.fallbackUrl] : [source.url]
  );

  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return rankBy(data, {
      key: source.key,
      valueField: source.valueField ?? "count",
      limit,
      orderBy
    });
  }, [data, source, limit, orderBy]);

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

  const table = {
    columns: [
      { key: "label", label: source.columnLabel ?? "Name" },
      { key: "value", label: valueLabel, numeric: true, format: (value) => exactNumber(value) }
    ],
    rows: rows.map((row) => ({ ...row, key: row.label }))
  };

  return (
    <StatCard
      title={title}
      description={description}
      controls={controls}
      status={status}
      isEmpty={!rows.length}
      table={table}
      footnote={footnote}
      height={Math.max(240, rows.length * 26 + 80)}
    >
      <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 26 + 40)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
        >
          <CartesianGrid stroke={INK.grid} horizontal={false} />
          <XAxis type="number" tickFormatter={format} {...axisProps} />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fontSize: 12, fill: INK.secondary }}
            stroke={INK.axis}
            tickLine={false}
          />
          <Tooltip content={<BarTooltip format={format} />} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
          <Bar dataKey="value" fill={SINGLE_HUE} radius={[0, 4, 4, 0]} barSize={14}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={format}
              style={{ fill: INK.secondary, fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </StatCard>
  );
}
