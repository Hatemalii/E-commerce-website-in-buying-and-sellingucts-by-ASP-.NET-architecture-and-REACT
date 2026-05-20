import React, { useState, useEffect } from 'react';
import apiService from '../api/apiService';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForms, setReviewForms] = useState({});
  const [submittingReview, setSubmittingReview] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiService.getMyOrders();
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const canReviewOrder = (status) => ['Paid', 'Completed', 'Delivered'].includes(status);

  const updateReviewForm = (itemId, field, value) => {
    setReviewForms(prev => ({
      ...prev,
      [itemId]: {
        rating: 5,
        comment: '',
        ...(prev[itemId] || {}),
        [field]: value
      }
    }));
  };

  const handleSubmitReview = async (orderId, item) => {
    const form = reviewForms[item.id] || { rating: 5, comment: '' };

    try {
      setSubmittingReview(prev => ({ ...prev, [item.id]: true }));
      await apiService.createReview({
        productId: item.productId,
        orderItemId: item.id,
        rating: Number(form.rating),
        comment: form.comment
      });

      setOrders(current => current.map(order => (
        order.id === orderId
          ? {
              ...order,
              items: order.items.map(orderItem => (
                orderItem.id === item.id ? { ...orderItem, hasReviewed: true } : orderItem
              ))
            }
          : order
      )));
    } catch (error) {
      alert('Review failed: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setSubmittingReview(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  if (loading) return <div className="empty-state">Loading your orders...</div>;

  return (
    <div>
      <h1 className="mb-lg">My Orders</h1>

      {orders.length === 0 ? (
        <div className="card empty-state">
          <h3 className="mb-sm">No orders yet</h3>
          <p>You haven't placed any orders.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          {orders.map(order => (
            <div key={order.id} className="card" style={{ padding: '1.5rem' }}>
              <div className="flex justify-between items-center mb-md" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Order #{order.id.substring(0, 8)}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-sm">
                  <span className={`badge badge-${canReviewOrder(order.status) ? 'success' : 'warning'}`}>{order.status}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                {order.items.map(item => (
                  <div key={item.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.productTitle}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600 }}>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>

                    {canReviewOrder(order.status) && (
                      <div style={{ marginTop: '1rem' }}>
                        {item.hasReviewed ? (
                          <span className="badge badge-success">Reviewed</span>
                        ) : (
                          <div className="flex flex-col gap-sm">
                            <div className="flex items-center gap-sm">
                              <label className="form-label" style={{ margin: 0 }}>Rating</label>
                              <select
                                className="form-control"
                                style={{ width: '90px' }}
                                value={reviewForms[item.id]?.rating || 5}
                                onChange={(e) => updateReviewForm(item.id, 'rating', e.target.value)}
                              >
                                <option value="5">5</option>
                                <option value="4">4</option>
                                <option value="3">3</option>
                                <option value="2">2</option>
                                <option value="1">1</option>
                              </select>
                            </div>
                            <textarea
                              className="form-control"
                              rows="2"
                              placeholder="Write your review"
                              value={reviewForms[item.id]?.comment || ''}
                              onChange={(e) => updateReviewForm(item.id, 'comment', e.target.value)}
                            />
                            <button
                              className="btn btn-primary"
                              style={{ alignSelf: 'flex-start' }}
                              onClick={() => handleSubmitReview(order.id, item)}
                              disabled={submittingReview[item.id]}
                            >
                              {submittingReview[item.id] ? 'Submitting...' : 'Submit Review'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
