import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const ranges = [14, 30, 60, 120, 180, "all"];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
  
    const current = payload[0].value;
    const index = payload[0].payload.index; // we’ll add this
    const prev = payload[0].payload.prevCount;
  
    const diff = prev != null ? current - prev : null;
  
    return (
      <div
        style={{
          background: "white",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: 6
        }}
      >
        <div>{new Date(label).toLocaleDateString()}</div>
        <div>Servers: {current.toLocaleString()}</div>
  
        {diff != null && (
          <div
            style={{
              color: diff >= 0 ? "green" : "red",
              fontWeight: 600
            }}
          >
            {diff >= 0 ? "+" : ""}
            {diff} from last day
          </div>
        )}
      </div>
    );
  };

export default function ServerCountChart() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("all");

  useEffect(() => {
    fetch("/api/stats/total-server-count")
      .then(res => res.json())
      .then(setData);
  }, []);

  // ✅ filter data based on selected range
  const filteredData = useMemo(() => {
    if (range === "all") return data;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);

    return data.filter(d => new Date(d.date) >= cutoff);
  }, [data, range]);

  const processedData = useMemo(() => {
    return filteredData.map((d, i) => ({
      ...d,
      prevCount: i > 0 ? filteredData[i - 1].count : null,
      index: i
    }));
  }, [filteredData]);

  const roundDownHundred = (num) => Math.floor(num / 100) * 100;
    const roundUpHundred = (num) => Math.ceil(num / 100) * 100;

    const yDomain = useMemo(() => {
        if (!filteredData.length) return [0, 100];
      
        const values = filteredData.map(d => d.count);
      
        const min = Math.min(...values);
        const max = Math.max(...values);
      
        return [
          roundDownHundred(min), // slight padding
          roundUpHundred(max)
        ];
      }, [filteredData]);

  return (
    <div style={{ width: "95%", height: 450, marginTop: "2rem", marginBottom: "6rem" }}>
      <h2 style={{ marginBottom: 10 }}>Server Growth</h2>

      {/* 🔥 Range selector */}
      <div style={{ marginBottom: 10 }}>
        {ranges.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              marginRight: 8,
              padding: "6px 10px",
              background: range === r ? "#333" : "#eee",
              color: range === r ? "#fff" : "#000",
              border: "none",
              cursor: "pointer",
              borderRadius: 4
            }}
          >
            {r === "all" ? "All" : `${r}d`}
          </button>
        ))}
      </div>

      <ResponsiveContainer>
        <LineChart
          data={processedData}
          margin={{ top: 20, right: 20, left: 40, bottom: 20 }}
        >
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) =>
                new Date(date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
              }
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            domain={yDomain}
            />
          <Tooltip content={<CustomTooltip />}/>
          <Line
            type="monotone"
            dataKey="count"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}