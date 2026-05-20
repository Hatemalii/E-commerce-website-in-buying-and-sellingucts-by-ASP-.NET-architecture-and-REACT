import React, { useState, useEffect } from 'react';
import apiService from '../api/apiService';

const ProductForm = ({ initialData, onSubmit, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    image: ''
  });
  
  const [errors, setErrors] = useState({});
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'image') setImagePreviewFailed(false);
    // clear error for field
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) newErrors.price = 'Price must be a positive number';
    if (!formData.stock || isNaN(formData.stock) || Number(formData.stock) < 0) newErrors.stock = 'Stock must be a non-negative number';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    const imageUrl = formData.image?.trim();
    if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !/^data:image\//i.test(imageUrl)) {
      newErrors.image = 'Image must be a direct http/https image URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const imageUrl = formData.image?.trim();
      onSubmit({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        categoryId: Number(formData.categoryId),
        imagesBase64: imageUrl ? [imageUrl] : []
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
      <div className="form-group mb-0">
        <label className="form-label">Title</label>
        <input type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} />
        {errors.title && <span className="error-text">{errors.title}</span>}
      </div>

      <div className="form-group mb-0">
        <label className="form-label">Description</label>
        <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group mb-0">
          <label className="form-label">Price ($)</label>
          <input type="number" step="0.01" name="price" className="form-control" value={formData.price} onChange={handleChange} />
          {errors.price && <span className="error-text">{errors.price}</span>}
        </div>
        <div className="form-group mb-0">
          <label className="form-label">Stock Quantity</label>
          <input type="number" name="stock" className="form-control" value={formData.stock} onChange={handleChange} />
          {errors.stock && <span className="error-text">{errors.stock}</span>}
        </div>
      </div>

      <div className="form-group mb-0">
        <label className="form-label">Category</label>
        <select name="categoryId" className="form-control" value={formData.categoryId} onChange={handleChange}>
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
      </div>

      <div className="form-group mb-0">
        <label className="form-label">Image URL</label>
        <input type="text" name="image" className="form-control" value={formData.image} onChange={handleChange} placeholder="https://..." />
        {errors.image && <span className="error-text">{errors.image}</span>}
      </div>
      
      {formData.image && (
        <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
          <label className="form-label">Preview</label>
          <img
            src={formData.image.trim()}
            alt="Preview"
            onLoad={() => setImagePreviewFailed(false)}
            onError={() => setImagePreviewFailed(true)}
            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}
          />
          {imagePreviewFailed && (
            <span className="error-text" style={{ display: 'block' }}>
              Preview failed. Use a direct image link ending in .jpg, .png, .webp, or a valid image CDN URL.
            </span>
          )}
        </div>
      )}

      <div className="flex justify-end gap-sm mt-md">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save Product</button>
      </div>
    </form>
  );
};

export default ProductForm;
