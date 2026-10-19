import { useId } from 'react';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Label,
    BarChart, Bar,
    AreaChart, Area,
    XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';

const COLORS = ['#4ADE80', '#38BDF8', '#A78BFA', '#FBBF24', '#F472B6', '#FB7185', '#2DD4BF', '#818CF8'];

const fmt = new Intl.NumberFormat('ru-RU');
const fmtCompact = new Intl.NumberFormat('ru-RU', { notation: 'compact' });

const tooltipProps = {
    contentStyle: {
        background: 'var(--color-white)',
        border: '0.8px solid var(--color-border)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        fontSize: 12,
        padding: '8px 12px',
    },
    itemStyle: { color: 'var(--color-dark)' },
    labelStyle: { color: 'var(--color-dark-gray)', marginBottom: 4 },
    formatter: (value) => fmt.format(value),
};

const axisProps = { axisLine: false, tickLine: false };
const margin = { top: 8, right: 8, left: -8, bottom: 0 };

const Gradient = ({ id, color, from = 1, to = 0.3 }) => (
    <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={from} />
            <stop offset="100%" stopColor={color} stopOpacity={to} />
        </linearGradient>
    </defs>
);

const renderChart = (type, data, gid) => {
    if (type === 'pie') {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        return (
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={3}
                    cornerRadius={6}
                    stroke="none"
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                    <Label value={fmt.format(total)} position="center" className="chart-total" />
                </Pie>
                <Tooltip {...tooltipProps} />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="chart-legend-text">{value}</span>}
                />
            </PieChart>
        );
    }

    if (type === 'bar') {
        return (
            <BarChart data={data} margin={margin}>
                <Gradient id={gid} color={COLORS[0]} from={1} to={0.35} />
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => fmtCompact.format(v)} />
                <Tooltip {...tooltipProps} cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }} />
                <Bar dataKey="value" fill={`url(#${gid})`} radius={[8, 8, 0, 0]} maxBarSize={44} />
            </BarChart>
        );
    }

    return (
        <AreaChart data={data} margin={margin}>
            <Gradient id={gid} color={COLORS[0]} from={0.35} to={0} />
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => fmtCompact.format(v)} />
            <Tooltip {...tooltipProps} cursor={{ stroke: 'rgba(148, 163, 184, 0.5)' }} />
            <Area
                type="monotone"
                dataKey="value"
                stroke={COLORS[0]}
                strokeWidth={2.5}
                fill={`url(#${gid})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
            />
        </AreaChart>
    );
};

const ChartBlock = ({ type, title, data }) => {
    // Уникальный id градиента: несколько графиков на странице не должны конфликтовать
    const gid = 'grad' + useId().replace(/:/g, '');

    return (
        <div className="chart-block">
            {title && <p className="chart-block_title">{title}</p>}
            <div className="chart-block_body">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart(type, data, gid)}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartBlock;