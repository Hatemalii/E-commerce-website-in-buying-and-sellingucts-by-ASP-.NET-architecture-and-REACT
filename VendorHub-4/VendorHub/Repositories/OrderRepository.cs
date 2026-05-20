using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public class OrderRepository : GenericRepository<Order>, IOrderRepository
    {
        public OrderRepository(AppDbContext context) : base(context)
        {
        }

        
        public async Task<IEnumerable<Order>> GetCustomerOrdersAsync(Guid customerId)
        {
            return await _dbSet
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }


        public async Task<Order?> GetOrderWithItemsAsync(Guid orderId)
        {
            return await _dbSet
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);
        }


        public async Task AddOrderItemAsync(OrderItem orderItem)
        {
            await _context.OrderItems.AddAsync(orderItem);
        }


        public async Task<IEnumerable<OrderItem>> GetOrderItemsAsync(Guid orderId)
        {
            return await _context.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .ToListAsync();
        }

        
        public async Task<IEnumerable<Order>> GetVendorOrdersAsync(Guid vendorId, DateTime? from = null, DateTime? to = null)
        {
            
            var orderItems = await _context.OrderItems
                .Where(oi => oi.VendorId == vendorId)
                .Select(oi => oi.OrderId)
                .Distinct()
                .ToListAsync();

            var query = _dbSet.Where(o => orderItems.Contains(o.Id));

            if (from.HasValue)
                query = query.Where(o => o.CreatedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(o => o.CreatedAt <= to.Value);

            return await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        }


        public async Task<OrderItem?> GetOrderItemByIdAsync(Guid orderItemId)
        {
            return await _context.OrderItems
                .Include(oi => oi.Order)
                .FirstOrDefaultAsync(oi => oi.Id == orderItemId);
        }

        public async Task<OrderItem?> GetCustomerProductOrderItemAsync(Guid customerId, Guid productId)
        {
            return await _context.OrderItems
                .Include(oi => oi.Order)
                .FirstOrDefaultAsync(oi => oi.Order.CustomerId == customerId && oi.ProductId == productId);
        }
    }
}
