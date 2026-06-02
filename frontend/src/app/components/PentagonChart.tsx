"use client";

import React from 'react';
import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Tooltip
} from 'recharts';

interface PerformanceData {
  subject: string;
  highest_difficulty_reached: number;
  current_title: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const difficulty = data.highest_difficulty_reached;

    let glowClass = "";
    if (difficulty >= 1000) glowClass = "animate-pulse text-black shadow-[0_0_20px_rgba(0,0,0,1)] font-mono glitch";
    else if (difficulty >= 151) glowClass = "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse";
    else if (difficulty >= 101) glowClass = "text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]";

    return (
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{data.subject}</p>
        <p className={`text-lg font-black ${glowClass}`}>{data.current_title}</p>
        <p className="text-sm font-medium text-slate-600">Power Level: {difficulty}</p>
      </div>
    );
  }
  return null;
};

export default function PentagonChart({ data }: { data: PerformanceData[] }) {
  // Ensure we have 5 axes for a pentagon
  const subjects = ["Mathematics", "Physics", "Chemistry"];
  const chartData = subjects.map(s => {
      const d = data.find(item => item.subject === s);
      return d || { subject: s, highest_difficulty_reached: 50, current_title: "The Academy Student (Gifted)" };
  });

  return (
    <div className="w-full h-[400px] bg-white rounded-3xl p-6 shadow-xl border border-slate-50">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="Performance"
            dataKey="highest_difficulty_reached"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="#3b82f6"
            fillOpacity={0.15}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
