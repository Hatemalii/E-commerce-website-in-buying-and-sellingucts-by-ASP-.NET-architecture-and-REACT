using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using VendorHub.API.DTOs;
using VendorHub.API.Hubs;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interfaces;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IUserRepository _userRepo;

        public OrdersController(IOrderService orderService, IHubContext<NotificationHub> hubContext, IUserRepository userRepo)
        {
            _orderService = orderService;
            _hubContext = hubContext;
            _userRepo = userRepo;
        }

        private Guid GetCurrentUserId()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdValue);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            try
            {
                var customerId = GetCurrentUserId();
                var order = await _orderService.CreateOrderAsync(customerId, dto);
                // DB notification + SignalR to vendor handled inside OrderService
                return Ok(order);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyOrders()
        {
            var customerId = GetCurrentUserId();
            var orders = await _orderService.GetCustomerOrdersAsync(customerId);
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(Guid id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var order = await _orderService.GetOrderByIdAsync(id);

                // Ownership check: Customer who placed the order OR Admin
                if (order.CustomerId != userId && !User.IsInRole("Admin"))
                {
                    // Check if user is a vendor for this order
                    var isVendorForThisOrder = order.Items.Any(i => i.VendorId == userId);
                    if (!isVendorForThisOrder)
                    {
                        return Unauthorized(new { message = "You do not have permission to view this order." });
                    }
                }

                return Ok(order);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("vendor/sales")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> GetVendorSales([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var vendorId = GetCurrentUserId();
            if (!await _userRepo.HasVendorPermissionAsync(vendorId, "CanViewAnalytics"))
                return StatusCode(403, new { message = "You do not have permission to view analytics." });

            var sales = await _orderService.GetVendorSalesAsync(vendorId, from, to);
            return Ok(sales);
        }
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Vendor")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] string newStatus)
        {
            try
            {
                var vendorId = GetCurrentUserId();
                var success = await _orderService.UpdateOrderStatusAsync(vendorId, id, newStatus);
                if (!success) return BadRequest(new { message = "Invalid status or permission denied" });
                
                return Ok(new { message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
