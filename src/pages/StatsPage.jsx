import React from 'react';
import "../css/StatsPage.css";
import LifetimeCommandStats from "../statcomponents/LifetimeCommandStats";
import LifetimeCategoryStats from "../statcomponents/LifetimeCategoryStats";
import ServerCountChart from '../statcomponents/ServerCountStats';
import ServerCountDistribution from '../statcomponents/ServerCountDistributionStats'; 

const StatsPage = () => {
    return (
        <div className="stats-page">
            <h1 className="stats-title">Stats</h1>
            <LifetimeCommandStats />
            <hr />
            <LifetimeCategoryStats />
            <hr/>
            <ServerCountChart />
            <hr/>
            <ServerCountDistribution />
        </div>
    )
}

export default StatsPage;