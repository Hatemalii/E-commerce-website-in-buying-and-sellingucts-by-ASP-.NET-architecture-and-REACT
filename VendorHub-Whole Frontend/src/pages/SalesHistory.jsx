import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';

const SalesHistory = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      if (!user) return;
      try {
        const response = await apiService.getVendorSales();
        const salesFlat = [];
        response.data.forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              salesFlat.push({
                id: order.id + '-' + item.productId,
                date: new Date(order.createdAt).toISOString().split('T')[0],
                product: item.productTitle,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice
              });
            });
          }
        });
        setSales(salesFlat);
      } catch (error) {
        console.error('Error fetching sales:', error);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [user]);

  const filteredSales = filterDate 
    ? sales.filter(s => s.date === filterDate)
    : sales;

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

  const exportCSV = () => {
    if (filteredSales.length === 0) return;
    
    const headers = ['Date', 'Product', 'Quantity', 'Unit Price', 'Total'];
    const csvContent = [
      headers.join(','),
      ...filteredSales.map(s => `"${s.date}","${s.product}",${s.quantity},${s.unitPrice},${s.total}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_history_${filterDate || 'all'}.csv`;
    link.click();
  };

  if (loading) return <div className="empty-state">Loading sales history...</div>;

  return (
    <div>
      <h1 className="mb-lg">Sales History</h1>
      
      <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex items-center gap-md">
          <label style={{ fontWeight: 500 }}>Filter by Date:</label>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: 'auto' }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          {filterDate && (
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => setFilterDate('')}>
              Clear
            </button>
          )}
        </div>
        <button className="btn btn-primary" onClick={exportCSV} disabled={filteredSales.length === 0}>
          Export to CSV
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Product</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Unit Price</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state" style={{ padding: '2rem' }}>No sales found for the selected criteria.</td>
              </tr>
            ) : (
              <>
                {filteredSales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{sale.date}</td>
                    <td style={{ padding: '1rem' }}>{sale.product}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{sale.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>${sale.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>${sale.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid var(--border-color)' }}>
                  <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>Total Revenue:</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>${totalRevenue.toFixed(2)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesHistory;
