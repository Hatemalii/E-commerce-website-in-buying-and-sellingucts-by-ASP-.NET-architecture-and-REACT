import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { IconChart } from '../components/icons';

const Analytics = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiService.getVendorSales();
        setOrders(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const analytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last30Days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (29 - index));
      const key = date.toISOString().slice(0, 10);
      return { key, label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), revenue: 0 };
    });

    const revenueByDay = Object.fromEntries(last30Days.map(day => [day.key, day]));
    const productMap = {};

    orders.forEach(order => {
      if (order.status === 'Cancelled') return;

      const orderDate = new Date(order.createdAt);
      const dayKey = orderDate.toISOString().slice(0, 10);

      (order.items || []).forEach(item => {
        const units = item.quantity || 0;
        const revenue = units * (item.unitPrice || 0);

        if (revenueByDay[dayKey]) {
          revenueByDay[dayKey].revenue += revenue;
        }

        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            id: item.productId,
            name: item.productTitle,
            units: 0,
            revenue: 0,
            orders: new Set()
          };
        }

        productMap[item.productId].units += units;
        productMap[item.productId].revenue += revenue;
        productMap[item.productId].orders.add(order.id);
      });
    });

    const products = Object.values(productMap)
      .map(product => ({
        ...product,
        orders: product.orders.size,
        averageOrderValue: product.orders.size ? product.revenue / product.orders.size : 0
      }))
      .sort((a, b) => b.units - a.units);

    const revenueSeries = last30Days.map(day => revenueByDay[day.key]);
    const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
    const totalUnits = products.reduce((sum, product) => sum + product.units, 0);

    return { products, revenueSeries, totalRevenue, totalUnits };
  }, [orders]);

  if (loading) return <div className="empty-state">Loading analytics...</div>;

  const maxRevenue = Math.max(...analytics.revenueSeries.map(day => day.revenue), 1);
  const maxUnits = Math.max(...analytics.products.map(product => product.units), 1);
  const hasRevenue = analytics.revenueSeries.some(day => day.revenue > 0);
  const chartWidth = 600;
  const chartHeight = 220;
  const chartPadding = { top: 16, right: 18, bottom: 26, left: 46 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartPoints = analytics.revenueSeries.map((day, index) => {
    const x = chartPadding.left + (index / Math.max(analytics.revenueSeries.length - 1, 1)) * plotWidth;
    const y = chartPadding.top + plotHeight - (day.revenue / maxRevenue) * plotHeight;
    return { ...day, x, y };
  });
  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartPadding.top + plotHeight} L ${chartPoints[0].x} ${chartPadding.top + plotHeight} Z`
    : '';

  return (
    <div>
      <div className="flex items-center gap-sm mb-lg">
        <IconChart className="text-primary" style={{ width: '28px', height: '28px' }} />
        <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
      </div>

      {error && (
        <div className="card mb-lg" style={{ padding: '1rem', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>${analytics.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Units Sold</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{analytics.totalUnits}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Products Sold</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{analytics.products.length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="mb-md" style={{ fontSize: '1.25rem' }}>Revenue (Last 30 Days)</h2>
          <div style={{ position: 'relative', width: '100%', minHeight: '270px' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label="Revenue for the last 30 days"
              style={{ width: '100%', height: '250px', display: 'block' }}
            >
              {[0, 0.25, 0.5, 0.75, 1].map(step => {
                const y = chartPadding.top + plotHeight - step * plotHeight;
                return (
                  <g key={step}>
                    <line
                      x1={chartPadding.left}
                      y1={y}
                      x2={chartPadding.left + plotWidth}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.35)"
                      strokeWidth="1"
                    />
                    <text x="4" y={y + 4} fill="var(--text-secondary)" fontSize="11">
                      ${Math.round(maxRevenue * step)}
                    </text>
                  </g>
                );
              })}

              <line
                x1={chartPadding.left}
                y1={chartPadding.top + plotHeight}
                x2={chartPadding.left + plotWidth}
                y2={chartPadding.top + plotHeight}
                stroke="var(--border-color)"
                strokeWidth="2"
              />

              {chartPoints.map(point => {
                const barWidth = Math.max(plotWidth / analytics.revenueSeries.length - 4, 4);
                const barHeight = point.revenue > 0 ? Math.max(chartPadding.top + plotHeight - point.y, 4) : 2;
                return (
                  <rect
                    key={point.key}
                    x={point.x - barWidth / 2}
                    y={chartPadding.top + plotHeight - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    fill={point.revenue > 0 ? 'rgba(37, 99, 235, 0.32)' : 'rgba(148, 163, 184, 0.28)'}
                  >
                    <title>{`${point.label}: $${point.revenue.toFixed(2)}`}</title>
                  </rect>
                );
              })}

              {hasRevenue && (
                <>
                  <path d={areaPath} fill="rgba(37, 99, 235, 0.12)" />
                  <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {chartPoints.filter(point => point.revenue > 0).map(point => (
                    <circle key={`${point.key}-dot`} cx={point.x} cy={point.y} r="4" fill="var(--primary)">
                      <title>{`${point.label}: $${point.revenue.toFixed(2)}`}</title>
                    </circle>
                  ))}
                </>
              )}

              <text x={chartPadding.left} y={chartHeight - 6} fill="var(--text-secondary)" fontSize="11">
                {analytics.revenueSeries[0]?.label}
              </text>
              <text x={chartPadding.left + plotWidth} y={chartHeight - 6} textAnchor="end" fill="var(--text-secondary)" fontSize="11">
                {analytics.revenueSeries[analytics.revenueSeries.length - 1]?.label}
              </text>
            </svg>

            {!hasRevenue && (
              <div className="empty-state" style={{ position: 'absolute', inset: '70px 0 auto 0', padding: 0, pointerEvents: 'none' }}>
                No revenue in the last 30 days.
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="mb-md" style={{ fontSize: '1.25rem' }}>Top Products by Units Sold</h2>
          {analytics.products.length === 0 ? (
            <p className="empty-state" style={{ padding: 0 }}>No sales yet.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {analytics.products.slice(0, 5).map(product => {
                const widthPercent = (product.units / maxUnits) * 100;
                return (
                  <div key={product.id}>
                    <div className="flex justify-between items-center mb-xs" style={{ fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{product.name}</span>
                      <span style={{ fontWeight: 600 }}>{product.units} units</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${widthPercent}%`, height: '100%', backgroundColor: 'var(--success)', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 className="mb-md" style={{ fontSize: '1.25rem' }}>Performance Table</h2>
        {analytics.products.length === 0 ? (
          <p className="empty-state" style={{ padding: 0 }}>No product performance data yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Product Name</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Orders</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {analytics.products.map(product => (
                  <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 500 }}>{product.name}</td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>{product.orders}</td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>{product.units}</td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>${product.revenue.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>${product.averageOrderValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
