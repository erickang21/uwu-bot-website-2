import React, { useState } from "react";
import { exactNumber } from "./chartTheme";

function DataTable({ columns, rows }) {
  if (!rows.length) return <p className="stats-empty">Nothing recorded yet.</p>;
  return (
    <div className="stats-table-scroll">
      <table className="stats-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={column.numeric ? "is-numeric" : ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key ?? index}>
              {columns.map((column) => (
                <td key={column.key} className={column.numeric ? "is-numeric" : ""}>
                  {column.format
                    ? column.format(row[column.key], row)
                    : column.numeric
                      ? exactNumber(row[column.key])
                      : String(row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Shell every chart sits in: heading, its controls, and a chart/table switch.
 * The table view is not decoration — several palette slots sit below 3:1 against
 * the card surface, and an exact-values table is the required alternative.
 */
export default function StatCard({
  title,
  description,
  controls,
  status,
  isEmpty,
  table,
  footnote,
  height = 320,
  tableOnly = false,
  children
}) {
  const [view, setView] = useState(tableOnly ? "table" : "chart");
  const showTable = (tableOnly || view === "table") && table;

  return (
    <section className="stats-card">
      <header className="stats-card-header">
        <div>
          <h2 className="stats-card-title">{title}</h2>
          {description ? <p className="stats-card-description">{description}</p> : null}
        </div>
        {table && !tableOnly ? (
          <div className="stats-view-toggle" role="group" aria-label="View as">
            <button
              type="button"
              className={`stats-segment${view === "chart" ? " is-selected" : ""}`}
              aria-pressed={view === "chart"}
              onClick={() => setView("chart")}
            >
              Chart
            </button>
            <button
              type="button"
              className={`stats-segment${view === "table" ? " is-selected" : ""}`}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              Table
            </button>
          </div>
        ) : null}
      </header>

      {controls ? <div className="stats-card-controls">{controls}</div> : null}

      <div className="stats-card-body" style={{ minHeight: height }}>
        {status === "loading" ? <p className="stats-empty">Loading…</p> : null}
        {status === "error" ? (
          <p className="stats-empty">
            This metric isn&apos;t available from the stats API yet.
          </p>
        ) : null}
        {status === "ready" && isEmpty ? (
          <p className="stats-empty">Nothing recorded for this range yet.</p>
        ) : null}
        {status === "ready" && !isEmpty ? (showTable ? <DataTable {...table} /> : children) : null}
      </div>

      {footnote ? <p className="stats-card-footnote">{footnote}</p> : null}
    </section>
  );
}
