// mockData.js
export const mockProducts = [
  {
    id: 1,
    title: 'Wireless Noise-Canceling Headphones',
    description: 'High-quality over-ear headphones with active noise cancelation.',
    price: 299.99,
    stock: 15,
    category: 'Electronics',
    vendorId: 2,
    vendorName: 'Tech Haven',
    rating: 4.8,
    reviewsCount: 124,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
    status: 'approved'
  },
  {
    id: 2,
    title: 'Minimalist Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness.',
    price: 45.00,
    stock: 50,
    category: 'Home & Office',
    vendorId: 2,
    vendorName: 'Tech Haven',
    rating: 4.5,
    reviewsCount: 32,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
    status: 'approved'
  },
  {
    id: 3,
    title: 'Ergonomic Office Chair',
    description: 'Comfortable mesh chair with lumbar support.',
    price: 199.99,
    stock: 5,
    category: 'Furniture',
    vendorId: 3,
    vendorName: 'Comfort Living',
    rating: 4.2,
    reviewsCount: 89,
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=400&q=80',
    status: 'pending'
  }
];

export const mockVendors = [
  { id: 2, name: 'Tech Haven', description: 'Latest electronics and gadgets.', status: 'approved' },
  { id: 3, name: 'Comfort Living', description: 'Home furniture and accessories.', status: 'approved' },
  { id: 4, name: 'Gadget World', description: 'Cool tech accessories.', status: 'pending' },
];

export const mockOrders = [
  {
    id: 101,
    customerId: 5,
    date: '2023-10-01T10:00:00Z',
    total: 344.99,
    status: 'Delivered',
    items: [
      { productId: 1, title: 'Wireless Noise-Canceling Headphones', quantity: 1, price: 299.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
      { productId: 2, title: 'Minimalist Desk Lamp', quantity: 1, price: 45.00, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80' }
    ]
  }
];

export const getVendorSales = (vendorId) => {
  return [
    { id: 201, date: '2023-10-01', product: 'Wireless Noise-Canceling Headphones', quantity: 2, unitPrice: 299.99, total: 599.98 },
    { id: 202, date: '2023-10-02', product: 'Minimalist Desk Lamp', quantity: 5, unitPrice: 45.00, total: 225.00 },
    { id: 203, date: '2023-10-03', product: 'Wireless Noise-Canceling Headphones', quantity: 1, unitPrice: 299.99, total: 299.99 },
    { id: 204, date: '2023-10-05', product: 'Minimalist Desk Lamp', quantity: 3, unitPrice: 45.00, total: 135.00 },
  ];
};

export const mockNotifications = [
  { id: 1, type: 'order', message: 'New order #102 received.', time: '10 mins ago', read: false },
  { id: 2, type: 'system', message: 'Your product was approved by the admin.', time: '1 hour ago', read: false },
  { id: 3, type: 'review', message: 'User left a 5-star review.', time: '1 day ago', read: true }
];
