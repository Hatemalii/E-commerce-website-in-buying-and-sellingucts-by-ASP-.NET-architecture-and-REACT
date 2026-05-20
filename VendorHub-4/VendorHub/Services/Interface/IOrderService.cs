using VendorHub.API.DTOs;

namespace VendorHub.API.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderResponseDto> CreateOrderAsync(Guid customerId, CreateOrderDto dto);
        Task<List<OrderResponseDto>> GetCustomerOrdersAsync(Guid customerId);
        Task<OrderResponseDto> GetOrderByIdAsync(Guid orderId);
        Task<List<OrderResponseDto>> GetVendorSalesAsync(Guid vendorId, DateTime? from = null, DateTime? to = null);
        Task<bool> UpdateOrderStatusAsync(Guid vendorId, Guid orderId, string newStatus);
    }
}