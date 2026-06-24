'use strict';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0a0a0a', '#404040', '#737373', '#a3a3a3', '#d4d4d4'];

export default function PieChartCard({ data, height = 260 }) {
  if (!data?.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-edge-muted text-sm text-center px-4">
        <p className="font-medium text-edge-foreground">No traffic data yet</p>
        <p className="mt-1 text-xs">Generate traffic in Simulator to see how load is split across backends.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e5e5e5',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
