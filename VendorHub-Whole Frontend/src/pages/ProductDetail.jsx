import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../api/apiService';
import { IconStar, IconPackage } from '../components/icons';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

const ProductDetail = () => {
  const { id } = useParams();
  const { user, isCustomer, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiService.getProductById(id);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleBuy = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isAdmin) {
      alert('Admins cannot purchase products.');
      return;
    }

    try {
      setPurchasing(true);
      await apiService.createOrder({
        items: [{ productId: id, quantity }]
      });
      alert(`Successfully purchased ${quantity}x ${product.title}!`);
      // Refresh product to update stock
      const response = await apiService.getProductById(id);
      setProduct(response.data);
    } catch (error) {
      const msg = error.response?.data?.message || 'Purchase failed';
      alert(msg);
    } finally {
      setPurchasing(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      if (isFavorited) {
        await apiService.removeFavorite(id);
        setIsFavorited(false);
      } else {
        await apiService.addFavorite(id);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  if (loading) return <div className="empty-state">Loading product details...</div>;
  if (!product) return <div className="empty-state">Product not found.</div>;

  const mainImage = product.images?.[0]?.imageUrl || product.thumbnailUrl || PLACEHOLDER_IMAGE;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Image */}
          <div style={{ flex: '1 1 400px', backgroundColor: '#f8fafc', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={mainImage}
              alt={product.title}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
          
          {/* Details */}
          <div style={{ flex: '1 1 400px', padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className="badge badge-primary">{product.categoryName}</span>
              {product.stock > 0 ? (
                <span className="badge badge-success">In Stock</span>
              ) : (
                <span className="badge badge-danger">Out of Stock</span>
              )}
            </div>
            
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{product.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Sold by <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.vendorName || product.storeName}</span></p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>${product.price.toFixed(2)}</span>
              <div className="flex items-center gap-xs">
                <IconStar className="text-warning" style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: 600 }}>{product.averageRating?.toFixed(1) || '0.0'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>({product.reviewCount || 0} reviews)</span>
              </div>
            </div>
            
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {product.viewerCount || 0} views
            </p>
            
            <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>{product.description}</p>
            
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)' }}>
              <div className="flex items-center gap-md mb-md">
                <label style={{ fontWeight: 500 }}>Quantity</label>
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ width: '80px' }} 
                  min="1" 
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={product.stock <= 0}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {product.stock} available
                </span>
              </div>
              
              <div className="flex gap-sm">
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '1.1rem', padding: '0.75rem' }}
                  onClick={handleBuy}
                  disabled={product.stock <= 0 || purchasing || isAdmin}
                >
                  <IconPackage /> {purchasing ? 'Purchasing...' : 'Buy Now'}
                </button>
                {user && !isAdmin && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.75rem' }}
                    onClick={handleFavorite}
                  >
                    {isFavorited ? '♥' : '♡'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="mt-xl">
        <h2>Customer Reviews</h2>
        <div className="card mt-md" style={{ padding: '2rem' }}>
          {product.reviews && product.reviews.length > 0 ? (
            <div className="flex flex-col gap-md">
              {product.reviews.map(review => (
                <div key={review.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-sm mb-sm">
                    <strong>{review.customerName}</strong>
                    <span style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{review.comment}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
