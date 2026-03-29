import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function LifetimeCategoryStats() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/stats/command-usage-by-category")
      .then(res => res.json())
      .then(setData);
  }, []);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const COLORS = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7f7f",
    "#8dd1e1",
    "#a4de6c"
  ];

  return (
    <div style={{ width: "100%", height: 400, marginTop: "20px"}}>
      <h2 style={{ marginBottom: 10 }}>Command Usage by Category</h2>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            labelLine={false}
            label={({ category, percent }) => {
                if (percent < 0.03) return ""; // hide <3%
                return `${category} (${(percent * 100).toFixed(0)}%)`;
            }
            }
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, name) => {
              const percent = ((value / total) * 100).toFixed(1);
              return [`${value} (${percent}%)`, name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}