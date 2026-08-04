import React from "react";
import "../css/StatsPage.css";
import StatsAuth from "../statcomponents/StatsAuth";
import StatsDashboard from "../statcomponents/StatsDashboard";

const StatsFullPage = () => (
  <StatsAuth>
    <div className="stats-page">
      <header className="stats-header">
        <h1 className="stats-title">uwu bot stats — full</h1>
        <p className="stats-subtitle">
          Everything on the public page, plus reliability, performance and
          retention. Every metric is bucketed by UTC day; daily rows are kept for
          180 days, lifetime totals forever.
        </p>
      </header>

      <StatsDashboard full />
    </div>
  </StatsAuth>
);

export default StatsFullPage;
