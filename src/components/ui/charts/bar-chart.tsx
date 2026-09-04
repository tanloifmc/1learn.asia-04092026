"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

interface DataPoint {
  name: string;
  score: number;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string; // Base color
  height?: number;
  layout?: "horizontal" | "vertical";
}

export function BarChart({ 
  data, 
  color = "#B89862", 
  height = 300,
  layout = "vertical"
}: BarChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 10, right: 30, left: layout === "vertical" ? 40 : 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={layout === "horizontal"} vertical={layout === "vertical"} stroke="#0E1B3D" strokeOpacity={0.05} />
          
          {layout === "vertical" ? (
            <>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#0E1B3D", fontSize: 13, fontWeight: 500 }}
                width={120}
              />
            </>
          ) : (
            <>
              <XAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: "#0E1B3D", fontSize: 12, fontWeight: 500 }}
              />
              <YAxis type="number" domain={[0, 100]} hide />
            </>
          )}

          <Tooltip 
            cursor={{ fill: "rgba(14, 27, 61, 0.02)" }}
            contentStyle={{ 
              backgroundColor: "rgba(255, 255, 255, 0.95)", 
              border: "1px solid rgba(14, 27, 61, 0.1)", 
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(14, 27, 61, 0.1)",
              fontFamily: "var(--font-sans)"
            }}
            itemStyle={{ color: "#0E1B3D", fontWeight: "bold" }}
            labelStyle={{ color: "rgba(14, 27, 61, 0.6)", fontSize: "12px", textTransform: "uppercase" }}
          />
          <Bar dataKey="score" radius={layout === "vertical" ? [0, 8, 8, 0] : [8, 8, 0, 0]} barSize={layout === "vertical" ? 24 : 40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.score > 75 ? color : `${color}80`} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
