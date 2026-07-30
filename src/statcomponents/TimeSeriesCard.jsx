import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import StatCard from "./StatCard";
import { RangeControl, SegmentedControl } from "./StatsControls";
import { dailyUrl, foldByDate, pivotByDimension, useStats } from "./useStats";
import {
  axisProps,
  compactNumber,
  gridProps,
  INK,
  longDate,
  seriesColor,
  shortDate,
  SINGLE_HUE,
  SURFACE
} from "./chartTheme";

function ChartTooltip({ active, payload, label, format, showTotal }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

  return (
    <div className="stats-tooltip">
      <div className="stats-tooltip-title">{longDate(label)}</div>
      {payload.map((entry) => (
        <div className="stats-tooltip-row" key={entry.dataKey}>
          <span className="stats-tooltip-swatch" style={{ background: entry.color }} />
          <span className="stats-tooltip-name">{entry.name}</span>
          <span className="stats-tooltip-value">{format(entry.value)}</span>
        </div>
      ))}
      {showTotal && payload.length > 1 ? (
        <div className="stats-tooltip-total">
          <span className="stats-tooltip-name">Total</span>
          <span className="stats-tooltip-value">{format(total)}</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A daily metric over time. Each dimension option may point at its own metric
 * type, because a breakdown lives in a different document type than the total.
 */
export default function TimeSeriesCard({
  title,
  description,
  type,
  dimensions,
  defaultDimension,
  defaultRange = 30,
  form = "line",
  format = compactNumber,
  footnote,
  // "zero" fills from a zero baseline, right for volumes and counts of events.
  // "auto" plots a padded range as a plain line, for standing totals like server
  // count where zero is hundreds of times off-screen and a filled area anchored
  // to a truncated baseline would overstate the magnitude.
  baseline = "zero"
}) {
  const [range, setRange] = useState(defaultRange);
  const [dimensionValue, setDimensionValue] = useState(
    defaultDimension ?? dimensions[0].value
  );

  const option = dimensions.find((entry) => entry.value === dimensionValue) ?? dimensions[0];
  const metricType = option.type ?? type;
  const { data, status } = useStats(useMemo(() => [dailyUrl(metricType, range)], [metricType, range]));

  const { chartData, series, labels } = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) return { chartData: [], series: [], labels: {} };

    // Some series are ratios of stored counters (an average is totalMs/count),
    // so an option may compute its own series instead of summing fields.
    if (option.compute) {
      const computed = option.compute(rows);
      return {
        chartData: computed.data,
        series: computed.series,
        labels: computed.labels ?? {}
      };
    }

    if (option.dimension) {
      const pivoted = pivotByDimension(rows, {
        dimension: option.dimension,
        valueField: option.valueField ?? "count"
      });
      return { chartData: pivoted.data, series: pivoted.series, labels: {} };
    }

    const fields = option.fields ?? ["count"];
    return {
      chartData: foldByDate(rows, fields),
      series: fields,
      labels: option.labels ?? {}
    };
  }, [data, option]);

  const nameFor = (key) => labels[key] ?? key;
  const singleSeries = series.length === 1;
  const latest = chartData.length ? chartData[chartData.length - 1] : null;
  const latestTotal = latest
    ? series.reduce((sum, key) => sum + (Number(latest[key]) || 0), 0)
    : 0;

  const controls = (
    <>
      <RangeControl value={range} onChange={setRange} name={`${title}-range`} />
      {dimensions.length > 1 ? (
        <SegmentedControl
          label="Break down by"
          name={`${title}-dimension`}
          options={dimensions.map(({ value, label }) => ({ value, label }))}
          value={dimensionValue}
          onChange={setDimensionValue}
        />
      ) : null}
    </>
  );

  const table = {
    columns: [
      { key: "date", label: "Date", format: (value) => longDate(value) },
      ...series.map((key) => ({ key, label: nameFor(key), numeric: true }))
    ],
    rows: [...chartData].reverse().map((row) => ({ ...row, key: row.date }))
  };

  const tooltip = (
    <Tooltip
      content={<ChartTooltip format={format} showTotal={form === "stackedBar"} />}
      cursor={{ stroke: INK.axis, strokeWidth: 1 }}
    />
  );

  const yDomain =
    baseline === "auto"
      ? [
          (dataMin) => Math.floor(dataMin - Math.abs(dataMin) * 0.02),
          (dataMax) => Math.ceil(dataMax + Math.abs(dataMax) * 0.02)
        ]
      : [0, "auto"];

  const commonAxes = (
    <>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axisProps} />
      <YAxis tickFormatter={format} width={64} domain={yDomain} {...axisProps} />
    </>
  );

  const legend =
    series.length > 1 ? (
      <Legend
        formatter={(value) => <span style={{ color: INK.secondary }}>{nameFor(value)}</span>}
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
      />
    ) : null;

  let chart = null;
  if (form === "stackedBar") {
    chart = (
      <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        {commonAxes}
        {tooltip}
        {legend}
        {series.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            name={nameFor(key)}
            stackId="total"
            fill={singleSeries ? SINGLE_HUE : seriesColor(index, key)}
            stroke={SURFACE}
            strokeWidth={2}
            radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
          />
        ))}
      </BarChart>
    );
  } else if (singleSeries && baseline === "zero") {
    chart = (
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${metricType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SINGLE_HUE} stopOpacity={0.22} />
            <stop offset="100%" stopColor={SINGLE_HUE} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {commonAxes}
        {tooltip}
        <Area
          type="monotone"
          dataKey={series[0]}
          name={nameFor(series[0])}
          stroke={SINGLE_HUE}
          strokeWidth={2}
          fill={`url(#fill-${metricType})`}
          dot={false}
          activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
        />
      </AreaChart>
    );
  } else {
    chart = (
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        {commonAxes}
        {tooltip}
        {legend}
        {series.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={nameFor(key)}
            stroke={seriesColor(index, key)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: SURFACE, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    );
  }

  return (
    <StatCard
      title={title}
      description={description}
      controls={controls}
      status={status}
      isEmpty={!chartData.length}
      table={table}
      footnote={
        latest
          ? `Latest (${longDate(latest.date)}): ${format(latestTotal)}${footnote ? ` · ${footnote}` : ""}`
          : footnote
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        {chart}
      </ResponsiveContainer>
    </StatCard>
  );
}
