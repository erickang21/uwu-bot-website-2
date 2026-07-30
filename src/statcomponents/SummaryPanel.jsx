import React from "react";
import { useStats } from "./useStats";
import {
  compactNumber,
  exactNumber,
  longDate,
  milliseconds,
  percent,
  signed,
  STATUS
} from "./chartTheme";

// Status colours never carry meaning alone: each tile pairs the dot with a word.
const STATES = {
  good: { color: STATUS.good, label: "healthy" },
  warning: { color: STATUS.warning, label: "elevated" },
  critical: { color: STATUS.critical, label: "critical" }
};

function stateFor(value, warn, bad) {
  if (!Number.isFinite(value)) return null;
  if (value >= bad) return "critical";
  if (value >= warn) return "warning";
  return "good";
}

function StatTile({ label, value, delta, state, hint }) {
  const status = state ? STATES[state] : null;
  return (
    <div className="stats-tile">
      <div className="stats-tile-label">
        {label}
        {status ? (
          <span className="stats-tile-state">
            <span className="stats-tile-dot" style={{ background: status.color }} />
            {status.label}
          </span>
        ) : null}
      </div>
      <div className="stats-tile-value">{value}</div>
      {delta ? <div className="stats-tile-delta">{delta}</div> : null}
      {hint ? <div className="stats-tile-hint">{hint}</div> : null}
    </div>
  );
}

/**
 * Failure rate deliberately excludes user-input errors: a mistyped argument is
 * not the bot misbehaving, and including those would keep the number
 * permanently high.
 */
function failureRate(day) {
  if (!day?.commands?.count) return 0;
  return (day.errors.logic + day.errors.api) / day.commands.count;
}

export default function SummaryPanel() {
  const { data, status } = useStats(["/api/stats/summary"]);

  if (status === "loading") {
    return <p className="stats-empty">Loading summary…</p>;
  }

  if (status === "error" || !data?.today) {
    return (
      <p className="stats-empty">
        The summary endpoint (<code>/api/stats/summary</code>) isn&apos;t available yet.
      </p>
    );
  }

  const { today, yesterday, lifetime } = data;
  const defect = failureRate(today);
  const commandChange =
    yesterday?.commands?.count
      ? (today.commands.count - yesterday.commands.count) / yesterday.commands.count
      : null;

  return (
    <>
      <p className="stats-asof">
        Today so far — {longDate(today.date)} (UTC), refreshed every minute.
      </p>
      <div className="stats-tiles">
        <StatTile
          label="Servers"
          value={exactNumber(today.servers.count)}
          delta={`${signed(today.servers.delta)} today`}
          hint={`${exactNumber(today.servers.increase)} joined · ${exactNumber(today.servers.decrease)} left`}
        />
        <StatTile
          label="Members reached"
          value={compactNumber(today.members.count)}
          delta={`${signed(today.members.delta, compactNumber)} today`}
        />
        <StatTile
          label="Commands run"
          value={exactNumber(today.commands.count)}
          delta={commandChange === null ? null : `${signed(commandChange * 100, (v) => `${v.toFixed(1)}%`)} vs yesterday`}
          hint={`${percent(today.commands.count ? today.commands.slash / today.commands.count : 0, 0)} slash`}
        />
        <StatTile
          label="Failure rate"
          value={percent(defect)}
          state={stateFor(defect, 0.01, 0.03)}
          hint={`${exactNumber(today.errors.api)} api · ${exactNumber(today.errors.logic)} logic`}
        />
        <StatTile
          label="API failures"
          value={percent(today.api.failureRate)}
          state={stateFor(today.api.failureRate, 0.03, 0.1)}
          hint={
            today.worstApis?.length
              ? `worst: ${today.worstApis[0].api}`
              : "all providers clear"
          }
        />
        <StatTile
          label="Latency"
          value={milliseconds(today.latency.averageMs)}
          hint={`p95 ${milliseconds(today.latency.p95Ms)} · max ${milliseconds(today.latency.maxMs)}`}
        />
        <StatTile
          label="Active servers"
          value={exactNumber(today.activeGuilds)}
          hint={`${exactNumber(today.uniqueUsers)} unique users`}
        />
        <StatTile
          label="Avg time in a server"
          value={`${Math.round(lifetime?.retention?.averageDays ?? 0)}d`}
          hint={`${exactNumber(today.retention.leaves)} left today · ${exactNumber(today.retention.under24h)} within 24h`}
        />
        <StatTile
          label="Host CPU"
          value={`${Math.round(today.resources.averageCpuPercent)}%`}
          state={stateFor(today.resources.averageCpuPercent / 100, 0.6, 0.85)}
          hint={`peak ${Math.round(today.resources.peakCpuPercent)}% · ${Math.round(today.resources.averageMemRssMb)} MB rss`}
        />
      </div>
    </>
  );
}
