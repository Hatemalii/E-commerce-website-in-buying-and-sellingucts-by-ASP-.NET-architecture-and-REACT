using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public interface IOrderRepository : IGenericRepository<Order>
    {
        

        Task<IEnumerable<Order>> GetCustomerOrdersAsync(Guid customerId);

        
        Task<Order?> GetOrderWithItemsAsync(Guid orderId);

        
        Task AddOrderItemAsync(OrderItem orderItem);

       
        Task<IEnumerable<OrderItem>> GetOrderItemsAsync(Guid orderId);


        Task<IEnumerable<Order>> GetVendorOrdersAsync(Guid vendorId, DateTime? from = null, DateTime? to = null);


        Task<OrderItem?> GetOrderItemByIdAsync(Guid orderItemId);


        Task<OrderItem?> GetCustomerProductOrderItemAsync(Guid customerId, Guid productId);
    }
}