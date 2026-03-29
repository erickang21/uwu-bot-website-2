import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Label
} from "recharts";

export default function LifetimeCommandStats() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/stats/command-usage")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div style={{ width: "95vw", height: 600, marginTop: "2rem"}}>
        <h2 style={{ marginBottom: 10 }}>Command Usage (Lifetime)</h2>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 40, bottom: 80 }}>
          <XAxis dataKey="command" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}