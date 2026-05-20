using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.DTOs;
using VendorHub.API.Hubs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interfaces;

namespace VendorHub.API.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepo;
        private readonly IProductRepository _productRepo;
        private readonly INotificationRepository _notificationRepo;
        private readonly IUserRepository _userRepo;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly AppDbContext _context;

        public OrderService(
            IOrderRepository orderRepo,
            IProductRepository productRepo,
            INotificationRepository notificationRepo,
            IUserRepository userRepo,
            IHubContext<NotificationHub> hubContext,
            AppDbContext context)
        {
            _orderRepo = orderRepo;
            _productRepo = productRepo;
            _notificationRepo = notificationRepo;
            _userRepo = userRepo;
            _hubContext = hubContext;
            _context = context;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(Guid customerId, CreateOrderDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                decimal totalAmount = 0;
                var orderId = Guid.NewGuid();
                var orderItems = new List<OrderItem>();
                var productsToUpdate = new List<Product>();

                // 1. Validate all products and stock
                foreach (var item in dto.Items)
                {
                    var product = await _productRepo.GetByIdAsync(item.ProductId);
                    if (product == null)
                        throw new Exception($"Product {item.ProductId} not found");

                    if (product.Status != "Approved")
                        throw new Exception($"Product {product.Title} is not currently available for purchase");

                    if (product.Stock < item.Quantity)
                        throw new Exception($"Insufficient stock for product {product.Title}. Available: {product.Stock}");

                    var subtotal = product.Price * item.Quantity;
                    totalAmount += subtotal;

                    orderItems.Add(new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = orderId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = product.Price,
                        VendorId = product.VendorId
                    });

                    // Update stock
                    product.Stock -= item.Quantity;
                    productsToUpdate.Add(product);
                }

                // 2. Create Order
                var order = new Order
                {
                    Id = orderId,
                    CustomerId = customerId,
                    TotalAmount = totalAmount,
                    Status = "Paid",
                    CreatedAt = DateTime.UtcNow
                };

                await _orderRepo.AddAsync(order);
                await _orderRepo.SaveChangesAsync();

                // 3. Add Order Items
                foreach (var item in orderItems)
                {
                    await _orderRepo.AddOrderItemAsync(item);
                }
                await _orderRepo.SaveChangesAsync();

                // 4. Update Products (This handles RowVersion concurrency)
                foreach (var product in productsToUpdate)
                {
                    _productRepo.Update(product);
                }
                await _productRepo.SaveChangesAsync();

                // 5. Commit Transaction
                await transaction.CommitAsync();

                // 6. Notifications (After commit)
                var vendorGroups = orderItems.GroupBy(x => x.VendorId);
                foreach (var vendorGroup in vendorGroups)
                {
                    var vendorId = vendorGroup.Key;
                    var itemCount = vendorGroup.Sum(x => x.Quantity);
                    
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = vendorId,
                        Title = "New Purchase",
                        Message = $"Customer bought {itemCount} item(s) from your store!",
                        Type = "NewPurchase",
                        RelatedEntityId = order.Id,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _notificationRepo.AddAsync(notification);
                    await _notificationRepo.SaveChangesAsync();

                    await _hubContext.Clients.Group(vendorId.ToString())
                        .SendAsync("ReceiveNotification", new
                        {
                            id = notification.Id,
                            title = notification.Title,
                            message = notification.Message,
                            type = notification.Type,
                            relatedEntityId = order.Id,
                            isRead = false,
                            createdAt = DateTime.UtcNow
                        });
                }

                return await GetOrderByIdAsync(orderId);
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                throw new Exception("The purchase failed because product stock was updated by another user. Please refresh and try again.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception(ex.Message);
            }
        }

        public async Task<List<OrderResponseDto>> GetCustomerOrdersAsync(Guid customerId)
        {
            var orders = await _orderRepo.GetCustomerOrdersAsync(customerId);
            var result = new List<OrderResponseDto>();

            foreach (var order in orders)
            {
                result.Add(await MapToDto(order));
            }
            return result;
        }

        public async Task<OrderResponseDto> GetOrderByIdAsync(Guid orderId)
        {
            var order = await _orderRepo.GetOrderWithItemsAsync(orderId);
            if (order == null)
                throw new Exception("Order not found");

            return await MapToDto(order);
        }

        public async Task<List<OrderResponseDto>> GetVendorSalesAsync(Guid vendorId, DateTime? from = null, DateTime? to = null)
        {
            var orders = await _orderRepo.GetVendorOrdersAsync(vendorId, from, to);
            var result = new List<OrderResponseDto>();

            foreach (var order in orders)
            {
                result.Add(await MapToDto(order));
            }

            return result.OrderByDescending(o => o.CreatedAt).ToList();
        }

        public async Task<bool> UpdateOrderStatusAsync(Guid vendorId, Guid orderId, string newStatus)
        {
            var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null) return false;

            // Ownership check: Does this vendor have items in this order?
            var hasVendorItems = order.OrderItems.Any(oi => oi.VendorId == vendorId);
            if (!hasVendorItems) return false;

            // Simple Status Machine Logic
            var allowedStatus = new List<string> { "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled" };
            if (!allowedStatus.Contains(newStatus)) return false;

            // Update status
            order.Status = newStatus;
            await _orderRepo.SaveChangesAsync();

            // Notify Customer
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = order.CustomerId,
                Title = "Order Status Updated",
                Message = $"Your order #{order.Id.ToString().Substring(0, 8)} is now {newStatus}",
                Type = "OrderStatusUpdate",
                RelatedEntityId = order.Id,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _notificationRepo.AddAsync(notification);
            await _notificationRepo.SaveChangesAsync();

            await _hubContext.Clients.Group(order.CustomerId.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    relatedEntityId = order.Id,
                    isRead = false,
                    createdAt = DateTime.UtcNow
                });

            return true;
        }

        private async Task<OrderResponseDto> MapToDto(Order order)
        {
            var items = await _orderRepo.GetOrderItemsAsync(order.Id);
            var itemDtos = new List<OrderItemResponseDto>();

            foreach (var item in items)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);
                itemDtos.Add(new OrderItemResponseDto
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductTitle = product?.Title ?? "Unknown Product",
                    VendorId = item.VendorId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    HasReviewed = await _context.Reviews.AnyAsync(r => r.OrderItemId == item.Id)
                });
            }

            return new OrderResponseDto
            {
                Id = order.Id,
                CustomerId = order.CustomerId,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                Items = itemDtos
            };
        }
    }
}
