import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';
import ProductForm from '../components/ProductForm';
import { IconEdit, IconTrash } from '../components/icons';

const MyProperties = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getVendorProducts();
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await apiService.deleteProduct(id);
        fetchProducts(); // Refresh list
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Delete failed: ' + (error.response?.data?.message || 'Server error'));
      }
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct({
      id: product.id,
      title: product.title,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId || '',
      image: product.thumbnailUrl || ''
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentProduct(null);
    setIsEditing(true);
  };

  const handleSave = async (productData) => {
    try {
      if (currentProduct) {
        // Edit existing product
        await apiService.updateProduct(currentProduct.id, productData);
      } else {
        // Create new product
        await apiService.createProduct(productData);
      }
      setIsEditing(false);
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Save failed: ' + (error.response?.data?.message || error.response?.data || 'Server error'));
    }
  };

  if (loading) return <div className="empty-state">Loading products...</div>;

  if (isEditing) {
    return (
      <div>
        <h1 className="mb-lg">{currentProduct ? 'Edit Product' : 'Add New Product'}</h1>
        <div className="card" style={{ padding: '2rem', maxWidth: '800px' }}>
          <ProductForm 
            initialData={currentProduct} 
            onSubmit={handleSave} 
            onCancel={() => setIsEditing(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-lg">
        <h1 style={{ margin: 0 }}>My Products</h1>
        <button className="btn btn-primary" onClick={handleCreate}>+ Add Product</button>
      </div>

      {products.length === 0 ? (
        <div className="card empty-state">
          <h3 className="mb-sm">No products found</h3>
          <p>You haven't added any products yet.</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Price</th>
                <th style={{ padding: '1rem' }}>Stock</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{product.title}</td>
                  <td style={{ padding: '1rem' }}>{product.categoryName}</td>
                  <td style={{ padding: '1rem' }}>${product.price.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>{product.stock}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${product.status === 'Approved' ? 'success' : product.status === 'Pending' ? 'warning' : 'danger'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', marginRight: '0.5rem' }} onClick={() => handleEdit(product)} title="Edit">
                      <IconEdit style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(product.id)} title="Delete">
                      <IconTrash style={{ width: '18px', height: '18px' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyProperties;
