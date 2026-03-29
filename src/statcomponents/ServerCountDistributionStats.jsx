import { useEffect, useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f7f",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57"
];

export default function ServerCountDistribution() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/stats/server-size-distribution")
      .then(res => res.json())
      .then(setData);
  }, []);

  // ✅ compute total + percent
  const processedData = useMemo(() => {
    if (!data.length) return [];

    const total = data.reduce((sum, d) => sum + d.count, 0);

    return data.map(d => ({
      ...d,
      percent: (d.count / total) * 100
    }));
  }, [data]);

  if (!processedData.length) return <p>Loading...</p>;

  return (
    <div style={{ width: "100%", height: 400 }}>
      <h2 style={{ marginBottom: 10 }}>
        Server Size Distribution
      </h2>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={processedData}
            dataKey="count"
            nameKey="range"
            innerRadius={60}
            outerRadius={120}
            label={({ percent, name }) =>
              percent > 5 ? `${name}: ${percent.toFixed(0)}%` : ""
            }
            labelLine={false}
          >
            {processedData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, _, props) => [
              `${props.payload.percent.toFixed(1)}% (${value})`,
              `${props.name}`
            ]}
          />

          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}