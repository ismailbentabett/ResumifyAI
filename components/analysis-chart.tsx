'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChartBig, LineChart, PieChart } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartData {
  label: string;
  score: number;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-2 rounded-lg shadow-lg">
        <p className="font-medium">{payload[0].name || label}</p>
        <p className="text-primary">{`Score: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

const COLORS = [
  '#f97316',
  '#fb923c',
  '#fdba74',
  '#fed7aa',
  '#ffedd5',
  '#fff7ed',
];

export function AnalysisChart({ data }: { data: ChartData[] }) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.score,
  }));

  return (
    <Tabs
      defaultValue="bar"
      className="w-full h-full"
      onValueChange={(value) => setChartType(value as 'bar' | 'line' | 'pie')}
    >
      <div className="flex justify-end mb-4">
        <TabsList>
          <TabsTrigger value="bar" className="flex items-center gap-2">
            <BarChartBig className="h-4 w-4" />
            Bar
          </TabsTrigger>
          <TabsTrigger value="line" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Line
          </TabsTrigger>
          <TabsTrigger value="pie" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Pie
          </TabsTrigger>
        </TabsList>
      </div>
      <div className="w-full aspect-[16/9] min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fontSize: '0.75rem' }}
                tickMargin={25}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: '0.75rem' }}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          ) : chartType === 'line' ? (
            <RechartsLineChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fontSize: '0.75rem' }}
                tickMargin={25}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: '0.75rem' }}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f97316"
                strokeWidth={2}
                dot={{
                  fill: '#f97316',
                  stroke: '#fff',
                  strokeWidth: 2,
                  r: 6,
                }}
                activeDot={{
                  fill: '#f97316',
                  stroke: '#fff',
                  strokeWidth: 2,
                  r: 8,
                }}
              />
            </RechartsLineChart>
          ) : (
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, cx, x, y }) => {
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#888"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize="0.75rem"
                    >
                      {`${name} (${value}%)`}
                    </text>
                  );
                }}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          )}
        </ResponsiveContainer>
      </div>
    </Tabs>
  );
}
