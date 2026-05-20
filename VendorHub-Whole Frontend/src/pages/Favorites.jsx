import React from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const { favorites, loading, toggleFavorite } = useFavorites();

  const handleRemove = async (productId) => {
    await toggleFavorite(productId);
  };

  if (loading) return <div className="empty-state">Loading your favorites...</div>;

  return (
    <div>
      <h1 className="mb-lg">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="card empty-state">
          <h3 className="mb-sm">No favorites yet</h3>
          <p>Browse the shop and click the heart icon to save items here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {favorites.map(fav => (
            <div key={fav.productId} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Link to={`/product/${fav.productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ height: '180px', backgroundColor: '#f1f5f9' }}>
                  <img
                    src={fav.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={fav.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{fav.title}</h3>
                  <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 1rem 0' }}>
                    ${fav.price?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </Link>
              <div style={{ padding: '0 1rem 1rem 1rem', marginTop: 'auto' }}>
                <button
                  className="btn btn-outline"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)', width: '100%', justifyContent: 'center' }}
                  onClick={() => handleRemove(fav.productId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
