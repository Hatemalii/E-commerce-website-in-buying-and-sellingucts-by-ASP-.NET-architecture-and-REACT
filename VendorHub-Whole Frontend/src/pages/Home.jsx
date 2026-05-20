import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import apiService from '../api/apiService';
import { mockProducts } from '../utils/mockData';
import { IconSearch } from '../components/icons';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [backendCategories, setBackendCategories] = useState([]);

  useEffect(() => {
    // Fetch products from real backend
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProducts({ page: 1, pageSize: 20 });
        // The backend returns a PagedResult with an 'items' array
        if (response.data && response.data.items) {
          setProducts(response.data.items);
        } else {
          // Fallback to mock if API returns nothing (useful for first-time run)
          setProducts(mockProducts.filter(p => p.status === 'approved'));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(mockProducts.filter(p => p.status === 'approved'));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

    // Fetch real categories
    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategories();
        // Assuming the backend returns a list of category objects with a Name property
        const categoryNames = response.data.map(c => c.name);
        setBackendCategories(categoryNames);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const filteredProducts = products
    .filter(p => {
      const title = p.title || p.name || '';
      const vendorName = p.vendorName || '';
      return title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .filter(p => {
      if (category === '') return true;
      const catName = p.categoryName || p.category; // Handle both backend and mock data
      return catName === category;
    })
    .filter(p => {
      if (minPrice !== '' && p.price < parseFloat(minPrice)) return false;
      if (maxPrice !== '' && p.price > parseFloat(maxPrice)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0);
      return 0; // Default: no sorting / newest
    });

  const categories = backendCategories.length > 0 
    ? backendCategories 
    : [...new Set(products.map(p => p.categoryName || p.category))].filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Welcome to VendorHub</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Discover amazing products from verified vendors.</p>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <IconSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search products or vendors..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Price:</span>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Min" 
              style={{ width: '80px', padding: '0.4rem' }}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span style={{ color: 'var(--text-secondary)' }}>-</span>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Max" 
              style={{ width: '80px', padding: '0.4rem' }}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-control" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
