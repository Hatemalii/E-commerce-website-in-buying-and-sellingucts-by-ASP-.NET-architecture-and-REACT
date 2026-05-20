import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { IconStar, IconHeart } from './icons';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

const ProductCard = ({ product }) => {
  const { user, isCustomer } = useAuth();
  const { toggleFavorite, isProductFavorite } = useFavorites();
  
  const isFavorite = isProductFavorite(product.id);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to add favorites.");
      return;
    }
    await toggleFavorite(product.id);
  };

  return (
    <Link to={`/product/${product.id}`} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ position: 'relative', height: '200px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
        <img 
          src={product.thumbnailUrl || PLACEHOLDER_IMAGE} 
          alt={product.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} 
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        {product.stock <= 0 ? (
          <span className="badge badge-danger" style={{ position: 'absolute', top: '10px', left: '10px' }}>Out of Stock</span>
        ) : (
          <span className="badge badge-success" style={{ position: 'absolute', top: '10px', left: '10px' }}>In Stock ({product.stock})</span>
        )}
        
        {isCustomer && (
          <button 
            onClick={handleToggleFavorite}
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              backgroundColor: 'white', 
              borderRadius: '50%', 
              padding: '0.4rem', 
              boxShadow: 'var(--shadow-sm)',
              color: isFavorite ? 'var(--danger)' : 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconHeart filled={isFavorite} />
          </button>
        )}
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="flex justify-between items-start mb-sm">
          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>{product.title}</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>By {product.vendorName}</p>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>${product.price.toFixed(2)}</span>
          <div className="flex items-center gap-sm">
            <IconStar className="text-warning" style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{product.averageRating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
