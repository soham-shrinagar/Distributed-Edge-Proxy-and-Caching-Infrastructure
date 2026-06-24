'use strict';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART = {
  grid: '#e5e5e5',
  axis: '#a3a3a3',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e5e5',
  tooltipLabel: '#737373',
};

export default function TimeSeriesChart({ data, lines, height = 280 }) {
  if (!data?.length) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-edge-muted text-sm text-center px-4">
        <p className="font-medium text-edge-foreground">Waiting for traffic</p>
        <p className="mt-1 text-xs">Open Simulator and send requests — this chart updates every second.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="time" stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: CHART.tooltipBg,
            border: `1px solid ${CHART.tooltipBorder}`,
            borderRadius: '6px',
            fontSize: '12px',
          }}
          labelStyle={{ color: CHART.tooltipLabel }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name}
            stroke={l.color}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
