import React from "react";
import "../css/StatsPage.css";
import StatsGate from "../statcomponents/StatsGate";
import SummaryPanel from "../statcomponents/SummaryPanel";
import TimeSeriesCard from "../statcomponents/TimeSeriesCard";
import BreakdownCard from "../statcomponents/BreakdownCard";
import MetricTableCard from "../statcomponents/MetricTableCard";
import { approximatePercentile, dailyUrl, lifetimeUrl } from "../statcomponents/useStats";
import {
  compactNumber,
  exactNumber,
  milliseconds,
  percent
} from "../statcomponents/chartTheme";

const byDate = (a, b) => (a.date < b.date ? -1 : 1);

function Section({ title, blurb, children }) {
  return (
    <section className="stats-section">
      <h2 className="stats-section-title">{title}</h2>
      {blurb ? <p className="stats-section-blurb">{blurb}</p> : null}
      <div className="stats-grid">{children}</div>
    </section>
  );
}

const StatsPage = () => (
  <StatsGate>
    <div className="stats-page">
      <header className="stats-header">
        <h1 className="stats-title">uwu bot stats</h1>
        <p className="stats-subtitle">
          Every metric is bucketed by UTC day. Daily rows are kept for 180 days;
          lifetime totals are kept forever.
        </p>
      </header>

      <SummaryPanel />

      <Section
        title="Growth"
        blurb="Servers and members over time, in total and split by how large the servers are."
      >
        <TimeSeriesCard
          title="Servers"
          description="Total servers the bot is in."
          type="totalServerCount"
          baseline="auto"
          dimensions={[
            { value: "total", label: "Total", fields: ["count"] },
            { value: "size", label: "By server size", type: "serverCount", dimension: "range" }
          ]}
        />
        <TimeSeriesCard
          title="Joins and leaves"
          description="Servers gained and lost each day."
          type="guildChurn"
          dimensions={[
            {
              value: "both",
              label: "Joins vs leaves",
              fields: ["joins", "leaves"],
              labels: { joins: "Joined", leaves: "Left" }
            }
          ]}
        />
        <TimeSeriesCard
          title="Members reached"
          description="Combined member count of every server the bot is in."
          type="totalUserCount"
          baseline="auto"
          dimensions={[
            { value: "total", label: "Total", fields: ["count"] },
            {
              value: "size",
              label: "By server size",
              type: "memberCountBySize",
              dimension: "range"
            }
          ]}
          format={compactNumber}
        />
        <BreakdownCard
          title="Server size distribution"
          description="How many servers sit in each size band today."
          valueLabel="Servers"
          sources={[
            {
              value: "today",
              label: "Today",
              url: dailyUrl("serverCount", 1),
              key: "range",
              columnLabel: "Members"
            }
          ]}
          limit={12}
          orderBy="label"
        />
      </Section>

      <Section
        title="Command usage"
        blurb="Daily volume, and which commands and categories carry it."
      >
        <TimeSeriesCard
          title="Commands run"
          description="Total invocations per day."
          type="allCommandUsage"
          dimensions={[
            { value: "total", label: "Total", fields: ["count"] },
            {
              value: "mode",
              label: "Slash vs text",
              fields: ["slashCount", "textCount"],
              labels: { slashCount: "Slash", textCount: "Text" }
            },
            {
              value: "category",
              label: "By category",
              type: "commandUsageByCategory",
              dimension: "category"
            },
            {
              value: "size",
              label: "By server size",
              type: "commandUsageBySize",
              dimension: "range"
            }
          ]}
        />
        <BreakdownCard
          title="Busiest commands"
          description="Ranked by invocations."
          sources={[
            { value: "today", label: "Today", url: dailyUrl("commandUsage", 1), key: "command", columnLabel: "Command" },
            { value: "7d", label: "7 days", url: dailyUrl("commandUsage", 7), key: "command", columnLabel: "Command" },
            {
              value: "lifetime",
              label: "Lifetime",
              url: lifetimeUrl("commandUsageTotal"),
              key: "command",
              columnLabel: "Command"
            }
          ]}
          limit={15}
        />
        <BreakdownCard
          title="Usage by category"
          description="Which parts of the bot people actually use."
          sources={[
            { value: "today", label: "Today", url: dailyUrl("commandUsageByCategory", 1), key: "category", columnLabel: "Category" },
            {
              value: "lifetime",
              label: "Lifetime",
              url: lifetimeUrl("commandUsageByCategoryTotal"),
              key: "category",
              columnLabel: "Category"
            }
          ]}
          limit={12}
        />
        <BreakdownCard
          title="Usage by hour"
          description="When the day is busiest, in UTC."
          valueLabel="Commands"
          sources={[
            { value: "today", label: "Today", url: dailyUrl("hourlyUsage", 1), key: "hour", columnLabel: "Hour (UTC)" },
            { value: "7d", label: "7 days", url: dailyUrl("hourlyUsage", 7), key: "hour", columnLabel: "Hour (UTC)" }
          ]}
          limit={24}
          orderBy="label"
        />
      </Section>

      <Section
        title="Reliability"
        blurb="Errors are split by cause. Provider outages and our own defects are different problems, and a user mistyping an argument is neither."
      >
        <TimeSeriesCard
          title="Errors by cause"
          description="api = an upstream provider failed · logic = our bug · input = the user was told they got it wrong."
          type="commandErrors"
          dimensions={[
            {
              value: "kind",
              label: "By cause",
              fields: ["api", "logic", "validation"],
              labels: { api: "API", logic: "Logic", validation: "User input" }
            },
            {
              value: "category",
              label: "By category",
              type: "commandErrorsByCategory",
              dimension: "category"
            }
          ]}
        />
        <BreakdownCard
          title="Commands throwing errors"
          description="Ranked by error count."
          valueLabel="Errors"
          sources={[
            { value: "today", label: "Today", url: dailyUrl("commandErrorsByCommand", 1), key: "command", columnLabel: "Command" },
            { value: "7d", label: "7 days", url: dailyUrl("commandErrorsByCommand", 7), key: "command", columnLabel: "Command" },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("commandErrorsByCommandTotal"), key: "command", columnLabel: "Command" }
          ]}
          limit={12}
        />
        <MetricTableCard
          title="Upstream API health"
          description="Failure rate per provider, and how often we fell back to the local image cache."
          sources={[
            { value: "today", label: "Today", url: dailyUrl("apiCalls", 1) },
            { value: "7d", label: "7 days", url: dailyUrl("apiCalls", 7) },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("apiCallsTotal") }
          ]}
          sortKey="failed"
          groupBy="api"
          derive={(row) => {
            const count = Number(row.count) || 0;
            return {
              key: `${row.api}-${row.date ?? "all"}`,
              api: row.api,
              count,
              failed: Number(row.failed) || 0,
              fellBack: Number(row.fellBack) || 0,
              rate: count ? (Number(row.failed) || 0) / count : 0
            };
          }}
          columns={[
            { key: "api", label: "Provider" },
            { key: "count", label: "Calls", numeric: true },
            { key: "failed", label: "Failed", numeric: true },
            { key: "rate", label: "Failure rate", numeric: true, format: (value) => percent(value) },
            { key: "fellBack", label: "Fell back", numeric: true }
          ]}
        />
        <TimeSeriesCard
          title="Failed API calls"
          description="Upstream failures per day."
          type="apiCalls"
          dimensions={[
            { value: "total", label: "Total", fields: ["failed"], labels: { failed: "Failed calls" } },
            {
              value: "provider",
              label: "By provider",
              type: "apiCalls",
              dimension: "api",
              valueField: "failed"
            }
          ]}
        />
        <BreakdownCard
          title="Blocked invocations"
          description="Commands refused before running, by reason."
          valueLabel="Blocks"
          sources={[
            { value: "today", label: "Today", url: dailyUrl("commandBlocked", 1), key: "reason", columnLabel: "Reason" },
            { value: "30d", label: "30 days", url: dailyUrl("commandBlocked", 30), key: "reason", columnLabel: "Reason" },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("commandBlockedTotal"), key: "reason", columnLabel: "Reason" }
          ]}
          limit={10}
        />
        <BreakdownCard
          title="Permissions we were missing"
          description="What to consider adding to the invite URL."
          valueLabel="Times blocked"
          sources={[
            { value: "30d", label: "30 days", url: dailyUrl("permissionBlocked", 30), key: "permission", columnLabel: "Permission" },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("permissionBlockedTotal"), key: "permission", columnLabel: "Permission" }
          ]}
          limit={10}
        />
      </Section>

      <Section
        title="Performance"
        blurb="Command latency and host resources. CPU and memory are plotted separately — they share no scale."
      >
        <TimeSeriesCard
          title="Command latency"
          description="Average and slowest run per day."
          type="commandLatency"
          format={milliseconds}
          dimensions={[
            {
              value: "average",
              label: "Average vs slowest",
              compute: (rows) => ({
                data: rows
                  .map((row) => ({
                    date: row.date,
                    averageMs: row.count ? (row.totalMs ?? 0) / row.count : 0,
                    maxMs: row.maxMs ?? 0
                  }))
                  .sort(byDate),
                series: ["averageMs", "maxMs"],
                labels: { averageMs: "Average", maxMs: "Slowest" }
              })
            },
            {
              value: "p95",
              label: "p95",
              compute: (rows) => ({
                data: rows
                  .map((row) => ({ date: row.date, p95Ms: approximatePercentile(row, 0.95) }))
                  .sort(byDate),
                series: ["p95Ms"],
                labels: { p95Ms: "p95" }
              })
            }
          ]}
        />
        <MetricTableCard
          title="Slowest commands"
          description="Per-command latency, estimated from the stored histogram."
          sources={[
            { value: "today", label: "Today", url: dailyUrl("commandLatencyByCommand", 1) },
            { value: "7d", label: "7 days", url: dailyUrl("commandLatencyByCommand", 7) },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("commandLatencyByCommandTotal") }
          ]}
          sortKey="averageMs"
          groupBy="command"
          derive={(row) => {
            const count = Number(row.count) || 0;
            if (!count) return null;
            return {
              key: `${row.command}-${row.date ?? "all"}`,
              command: row.command,
              runs: count,
              averageMs: (Number(row.totalMs) || 0) / count,
              p95Ms: approximatePercentile(row, 0.95),
              maxMs: Number(row.maxMs) || 0
            };
          }}
          columns={[
            { key: "command", label: "Command" },
            { key: "runs", label: "Runs", numeric: true },
            { key: "averageMs", label: "Average", numeric: true, format: (value) => milliseconds(value) },
            { key: "p95Ms", label: "p95", numeric: true, format: (value) => milliseconds(value) },
            { key: "maxMs", label: "Slowest", numeric: true, format: (value) => milliseconds(value) }
          ]}
        />
        <TimeSeriesCard
          title="CPU"
          description="Average process CPU across shards, percent of one core."
          type="resourceUsage"
          format={(value) => `${Math.round(Number(value) || 0)}%`}
          dimensions={[
            {
              value: "cpu",
              label: "Average vs peak",
              compute: (rows) => ({
                data: rows
                  .map((row) => ({
                    date: row.date,
                    averageCpu: row.samples ? (row.cpuPercentTotal ?? 0) / row.samples : 0,
                    peakCpu: row.maxCpuPercent ?? 0
                  }))
                  .sort(byDate),
                series: ["averageCpu", "peakCpu"],
                labels: { averageCpu: "Average", peakCpu: "Peak" }
              })
            }
          ]}
        />
        <TimeSeriesCard
          title="Memory"
          description="Resident set size."
          type="resourceUsage"
          format={(value) => `${Math.round(Number(value) || 0)} MB`}
          dimensions={[
            {
              value: "memory",
              label: "Average vs peak",
              compute: (rows) => ({
                data: rows
                  .map((row) => ({
                    date: row.date,
                    averageMemory: row.samples ? (row.memRssMbTotal ?? 0) / row.samples : 0,
                    peakMemory: row.maxMemRssMb ?? 0
                  }))
                  .sort(byDate),
                series: ["averageMemory", "peakMemory"],
                labels: { averageMemory: "Average", peakMemory: "Peak" }
              })
            }
          ]}
        />
        <MetricTableCard
          title="Resources by shard"
          description="Spotting a hot shard."
          sources={[
            { value: "today", label: "Today", url: dailyUrl("resourceUsageByShard", 1) },
            { value: "7d", label: "7 days", url: dailyUrl("resourceUsageByShard", 7) }
          ]}
          sortKey="averageCpu"
          groupBy="shard"
          derive={(row) => {
            const samples = Number(row.samples) || 0;
            if (!samples) return null;
            return {
              key: `shard-${row.shard}`,
              shard: row.shard,
              averageCpu: (Number(row.cpuPercentTotal) || 0) / samples,
              peakCpu: Number(row.maxCpuPercent) || 0,
              averageMemory: (Number(row.memRssMbTotal) || 0) / samples,
              peakMemory: Number(row.maxMemRssMb) || 0
            };
          }}
          columns={[
            { key: "shard", label: "Shard" },
            { key: "averageCpu", label: "Avg CPU", numeric: true, format: (value) => `${Math.round(value)}%` },
            { key: "peakCpu", label: "Peak CPU", numeric: true, format: (value) => `${Math.round(value)}%` },
            { key: "averageMemory", label: "Avg RSS", numeric: true, format: (value) => `${Math.round(value)} MB` },
            { key: "peakMemory", label: "Peak RSS", numeric: true, format: (value) => `${Math.round(value)} MB` }
          ]}
          limit={40}
        />
      </Section>

      <Section
        title="Retention"
        blurb="How long servers keep the bot. A server that drops us inside a day is an onboarding problem, not ordinary churn."
      >
        <MetricTableCard
          title="Time in a server"
          description="Measured when the bot is removed."
          sources={[
            { value: "today", label: "Today", url: dailyUrl("guildRetention", 1) },
            { value: "30d", label: "30 days", url: dailyUrl("guildRetention", 30) },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("guildRetentionTotal") }
          ]}
          sortKey="leaves"
          derive={(row) => {
            const leaves = Number(row.leaves) || 0;
            if (!leaves) return null;
            return {
              key: row.date ?? "lifetime",
              period: row.date ?? "Lifetime",
              leaves,
              averageDays: (Number(row.totalDays) || 0) / leaves,
              under24h: Number(row.under24h) || 0,
              under7d: Number(row.under7d) || 0,
              under30d: Number(row.under30d) || 0,
              maxDays: Number(row.maxDays) || 0
            };
          }}
          columns={[
            { key: "period", label: "Period" },
            { key: "leaves", label: "Left", numeric: true },
            { key: "averageDays", label: "Avg stay", numeric: true, format: (value) => `${value.toFixed(1)}d` },
            { key: "under24h", label: "<24h", numeric: true },
            { key: "under7d", label: "<7d", numeric: true },
            { key: "under30d", label: "<30d", numeric: true },
            { key: "maxDays", label: "Longest", numeric: true, format: (value) => `${Math.round(value)}d` }
          ]}
          limit={31}
        />
        <BreakdownCard
          title="Commands people tried that don't exist"
          description="Alias gaps and feature requests, straight from what users typed."
          valueLabel="Attempts"
          sources={[
            { value: "30d", label: "30 days", url: dailyUrl("unknownCommand", 30), key: "attempted", columnLabel: "Typed" },
            { value: "lifetime", label: "Lifetime", url: lifetimeUrl("unknownCommandTotal"), key: "attempted", columnLabel: "Typed" }
          ]}
          limit={15}
          format={exactNumber}
        />
      </Section>
    </div>
  </StatsGate>
);

export default StatsPage;
