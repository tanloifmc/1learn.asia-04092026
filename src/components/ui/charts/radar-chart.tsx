"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface DataPoint {
  subject: string;
  A: number; // Value for the radar
  fullMark?: number;
}

interface RadarChartProps {
  data: DataPoint[];
  color?: string; // Hex color like "#B89862"
  height?: number;
}

export function RadarChart({ 
  data, 
  color = "#B89862", 
  height = 300 
}: RadarChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#0E1B3D" strokeOpacity={0.1} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "#0E1B3D", fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip 
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
          <Radar
            name="Điểm số"
            dataKey="A"
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
