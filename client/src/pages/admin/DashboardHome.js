import React, { useEffect, useState, useMemo } from 'react';
import { getDashboardAPI, getAdvancedDashboardAPI } from '../../api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import './AdminPanel.css';

// ── Clean chart card wrapper (matches reference style) ──────────────────────
const ChartCard = ({ title, action, children }) => (
  <div style={{
    background: 'var(--dark)',
    border: '1px solid var(--border2)',
    borderRadius: 16,
    padding: '24px 24px 20px',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{title}</span>
      {action}
    </div>
    {children}
  </div>
);

// ── Time-range dropdown (matching reference: "Last 6 Months / Last 12 Months") ──
const TimeFilter = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const opts = [
    { v: 7,  l: 'Last 7 Days'  },
    { v: 30, l: 'Last 30 Days' },
  ];
  const selected = opts.find(o => o.v === value);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--gold)', color: '#000',
          border: 'none', borderRadius: 8, padding: '7px 14px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
      >
        ✓ {selected?.l} <span style={{ fontSize: 9, marginLeft: 2 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, width: 165,
          background: 'var(--dark)', border: '1px solid var(--border2)',
          borderRadius: 10, overflow: 'hidden', zIndex: 50,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {opts.map(o => (
            <div
              key={o.v}
              onClick={() => { onChange(o.v); setOpen(false); }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                color: value === o.v ? 'var(--gold)' : 'var(--text2)',
                background: value === o.v ? 'rgba(201,168,76,0.08)' : 'transparent',
                fontWeight: value === o.v ? 600 : 400,
                transition: 'background 0.2s',
              }}
            >
              {value === o.v && '✓ '}{o.l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Donut chart legend (matching reference: colored dot + label) ─────────────
const DonutLegend = ({ items }) => (
  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px 20px', marginTop: 16 }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text2)' }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, flexShrink: 0, display: 'inline-block' }} />
        {item.name}
      </div>
    ))}
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [adv, setAdv]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueMonths, setRevenueMonths] = useState(6);

  useEffect(() => {
    Promise.all([getDashboardAPI(), getAdvancedDashboardAPI()])
      .then(([r1, r2]) => { setStats(r1.data.data); setAdv(r2.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Pad revenue data with empty days
  const revenueData = useMemo(() => {
    if (!adv?.salesGraph) return [];
    const result = [];
    for (let i = revenueMonths - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = adv.salesGraph.find(x => x._id === dateStr);
      result.push({
        date: dateStr,
        label: dateStr.slice(5),
        revenue: existing ? existing.revenue : 0,
      });
    }
    return result;
  }, [adv, revenueMonths]);

  // Pad user growth with empty months
  const userGrowthData = useMemo(() => {
    if (!adv?.userGrowth) return [];
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
      const existing = adv.userGrowth.find(x => x._id === monthStr);
      result.push({
        _id: monthStr,
        users: existing ? existing.users : 0,
      });
    }
    return result;
  }, [adv]);

  // Order status donut data
  const orderDonut = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Placed',    value: stats.placedOrders    || 0, color: '#5a9ce0' },
      { name: 'Confirmed', value: stats.confirmedOrders || 0, color: '#c9a84c' },
      { name: 'Completed', value: stats.completedOrders || 0, color: '#5acea0' },
      { name: 'Cancelled', value: stats.cancelledOrders || 0, color: '#e05a5a' },
    ].filter(d => d.value > 0);
  }, [stats]);

  if (loading) return <div className="ap-loading"><div className="spinner" /></div>;
  if (!stats || !adv) return <div className="ap-loading">Failed to load.</div>;

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySalesData = adv?.salesGraph?.find(x => x._id === todayDateStr) || { revenue: 0, orders: 0 };

  const statCards = [
    { icon: '💵', label: 'Today Revenue', value: `₹${todaySalesData.revenue.toLocaleString('en-IN')}`, color: '#c9a84c' },
    { icon: '🛒', label: 'Today Orders', value: todaySalesData.orders, color: '#5a9ce0' },
    { icon: '📚', label: 'Total Books',   value: stats.totalBooks,    color: '#5acea0' },
    { icon: '👥', label: 'Total Users',   value: stats.totalUsers,    color: '#c9a84c' },
    { icon: '🔄', label: 'Active Issues', value: stats.activeIssues,  color: '#e05a5a' },
    { icon: '✅', label: 'Returned',      value: stats.totalReturned, color: '#5a9ce0' },
  ];

  const tooltipStyle = {
    background: 'var(--dark2)',
    border: '1px solid var(--border2)',
    borderRadius: 10,
    fontSize: 13,
    color: 'var(--text)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  };

  return (
    <div className="page-enter">

      {/* Header */}
      <div className="ap-header">
        <h1 className="ap-title">Dashboard Overview</h1>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((c, i) => (
          <div key={i} style={{
            background: 'var(--dark)', border: '1px solid var(--border2)',
            borderTop: `2px solid ${c.color}`, borderRadius: 14, padding: '22px 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <span style={{ fontSize: 26 }}>{c.icon}</span>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 300, color: c.color, lineHeight: 1 }}>{c.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Row 1: Revenue Growth  +  Order Distribution (reference image layout) ── */}
      <div className="dash-row-1" style={{ marginBottom: 20 }}>

        {/* Revenue Growth — line / area chart with time-range selector */}
        <ChartCard
          title="Revenue Growth"
          action={<TimeFilter value={revenueMonths} onChange={setRevenueMonths} />}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5a9ce0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5a9ce0" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text3)' }}
              />
              <YAxis
                stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text3)' }}
                tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                labelFormatter={l => `Month: ${l}`}
                cursor={{ stroke: 'rgba(90,156,224,0.25)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#5a9ce0"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#5a9ce0', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Distribution — donut chart */}
        <ChartCard title="Order Distribution">
          {orderDonut.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={orderDonut}
                    cx="50%" cy="50%"
                    innerRadius={62} outerRadius={92}
                    startAngle={90} endAngle={-270}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {orderDonut.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, n) => [v, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <DonutLegend items={orderDonut} />
            </>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No order data yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: Monthly User Growth ── */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard title="Monthly User Growth">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={userGrowthData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5acea0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#5acea0" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="_id" stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--text3)' }} />
              <YAxis stroke="var(--text3)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--text3)' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={v => [v, 'New Users']}
                cursor={{ stroke: 'rgba(90,206,160,0.25)', strokeWidth: 1 }}
              />
              <Area
                type="monotone" dataKey="users"
                stroke="#5acea0" strokeWidth={2.5}
                fillOpacity={1} fill="url(#userGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#5acea0', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

    </div>
  );
}
