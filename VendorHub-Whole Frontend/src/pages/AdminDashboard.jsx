import React, { useState, useEffect } from 'react';
import apiService from '../api/apiService';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [stats, setStats] = useState({ vendors: 0, products: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, pRes, sRes, cRes] = await Promise.all([
        apiService.getPendingVendors(),
        apiService.getPendingProducts(),
        apiService.getAdminStats(),
        apiService.getCategories()
      ]);
      setVendors(vRes.data);
      setProducts(pRes.data);
      setCategories(cRes.data);
      setStats({
        vendors: sRes.data.vendors,
        products: sRes.data.products,
        pending: vRes.data.length + pRes.data.length
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVendorAction = async (id, action) => {
    try {
      if (action === 'approved') {
        await apiService.approveVendor(id);
      } else {
        await apiService.rejectVendor(id, 'Rejected by admin');
      }
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Action failed: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  const handleProductAction = async (id, action) => {
    try {
      if (action === 'approved') {
        await apiService.approveProduct(id);
      } else {
        const reason = prompt('Please enter a rejection reason:');
        if (!reason) return;
        await apiService.rejectProduct(id, reason);
      }
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Action failed: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      setSavingCategory(true);
      const response = await apiService.createCategory({ name });
      setCategories(current => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Category failed: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    try {
      await apiService.deleteCategory(category.id);
      setCategories(current => current.filter(item => item.id !== category.id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Delete failed: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  if (loading) return <div className="empty-state">Loading admin data...</div>;

  return (
    <div>
      <h1 className="mb-lg">Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Total Vendors</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.vendors}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Total Products</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.products}</p>
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="text-secondary" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Pending Action</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--warning)' }}>
            {stats.pending}
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            style={{ 
              padding: '1rem 2rem', 
              fontWeight: 600,
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'vendors' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'vendors' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('vendors')}
          >
            Pending Vendors ({vendors.length})
          </button>
          <button 
            style={{ 
              padding: '1rem 2rem', 
              fontWeight: 600,
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'products' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('products')}
          >
            Pending Products ({products.length})
          </button>
          <button 
            style={{ 
              padding: '1rem 2rem', 
              fontWeight: 600,
              backgroundColor: 'transparent',
              borderBottom: activeTab === 'categories' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'categories' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('categories')}
          >
            Categories ({categories.length})
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {activeTab === 'vendors' && (
            <div>
              {vendors.length === 0 ? (
                <p className="empty-state">No pending vendors to review.</p>
              ) : (
                <div className="flex flex-col gap-md">
                  {vendors.map(vendor => (
                    <div key={vendor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{vendor.fullName}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{vendor.storeName}: {vendor.storeDescription}</p>
                      </div>
                      <div className="flex gap-sm">
                        <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleVendorAction(vendor.id, 'rejected')}>Reject</button>
                        <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => handleVendorAction(vendor.id, 'approved')}>Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <p className="empty-state">No pending products to review.</p>
              ) : (
                <div className="flex flex-col gap-md">
                  {products.map(product => (
                    <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      <div className="flex items-center gap-md">
                        {product.images?.[0] && <img src={product.images[0]} alt={product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />}
                        <div>
                          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{product.title}</h4>
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Vendor: {product.vendorName} | Price: ${product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-sm">
                        <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleProductAction(product.id, 'rejected')}>Reject</button>
                        <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => handleProductAction(product.id, 'approved')}>Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <form onSubmit={handleCreateCategory} className="flex gap-sm mb-lg" style={{ alignItems: 'flex-start' }}>
                <div className="form-group mb-0" style={{ flex: 1, maxWidth: '420px' }}>
                  <label className="form-label">New Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '1.65rem' }}
                  disabled={savingCategory || !newCategoryName.trim()}
                >
                  {savingCategory ? 'Adding...' : 'Add Category'}
                </button>
              </form>

              {categories.length === 0 ? (
                <p className="empty-state">No categories found.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {categories.map(category => (
                    <div
                      key={category.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{category.name}</span>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.875rem' }}
                        onClick={() => handleDeleteCategory(category)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
