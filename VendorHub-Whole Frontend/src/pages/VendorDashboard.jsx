import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';

const VendorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
    totalSales: 0,
    revenue: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        const [productsRes, salesRes] = await Promise.all([
          apiService.getVendorProducts(),
          apiService.getVendorSales()
        ]);

        const { stats: productStats, products } = productsRes.data;
        const sales = salesRes.data;

        let totalSales = 0;
        let revenue = 0;
        const salesFlat = [];

        sales.forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              totalSales += item.quantity;
              revenue += item.quantity * item.unitPrice;
              salesFlat.push({
                id: order.id,
                date: new Date(order.createdAt).toLocaleDateString(),
                product: item.productTitle,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
                status: order.status
              });
            });
          }
        });

        setStats({ 
          approved: productStats.approvedProducts, 
          pending: productStats.pendingProducts, 
          rejected: productStats.rejectedProducts,
          totalSales: productStats.totalSales, 
          revenue: productStats.totalRevenue 
        });
        setRecentSales(salesFlat.slice(0, 10));
      } catch (error) {
        console.error('Error fetching vendor dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiService.updateOrderStatus(orderId, newStatus);
      // Refresh sales list
      const salesRes = await apiService.getVendorSales();
      const sales = salesRes.data;
      const salesFlat = [];
      sales.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            salesFlat.push({
              id: order.id,
              date: new Date(order.createdAt).toLocaleDateString(),
              product: item.productTitle,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              status: order.status
            });
          });
        }
      });
      setRecentSales(salesFlat.slice(0, 10));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="empty-state">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="mb-lg">Vendor Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Approved Products</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.approved}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Pending Products</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.pending}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Total Sales</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.totalSales}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>Total Revenue</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>${stats.revenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 className="mb-md">Recent Sales</h2>
        {recentSales.length === 0 ? (
          <p className="empty-state" style={{ padding: 0 }}>No recent sales.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Product</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Qty</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Total</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>{sale.date}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{sale.product}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>{sale.quantity}</td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>${sale.total.toFixed(2)}</td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <select 
                        className="form-control" 
                        style={{ width: 'auto', padding: '0.25rem' }} 
                        value={sale.status} 
                        onChange={(e) => handleUpdateStatus(sale.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
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

export default VendorDashboard;
