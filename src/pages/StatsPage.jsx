import React from "react";
import "../css/StatsPage.css";
import StatsDashboard from "../statcomponents/StatsDashboard";

const StatsPage = () => (
  <div className="stats-page">
    <header className="stats-header">
      <h1 className="stats-title">uwu bot stats</h1>
      <p className="stats-subtitle">
        Every metric is bucketed by UTC day. Daily rows are kept for 180 days;
        lifetime totals are kept forever.
      </p>
    </header>

    <StatsDashboard />
  </div>
);

export default StatsPage;
