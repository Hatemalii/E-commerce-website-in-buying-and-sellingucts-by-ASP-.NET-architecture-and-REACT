using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using VendorHub.API.Data;
using VendorHub.API.DTOs;
using VendorHub.API.Hubs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _userRepo;
        private readonly IProductRepository _productRepo;
        private readonly IOrderRepository _orderRepo;
        private readonly INotificationRepository _notificationRepo;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly AppDbContext _context;

        public AdminController(
            IUserRepository userRepo,
            IProductRepository productRepo,
            IOrderRepository orderRepo,
            INotificationRepository notificationRepo,
            IHubContext<NotificationHub> hubContext,
            AppDbContext context)
        {
            _userRepo = userRepo;
            _productRepo = productRepo;
            _orderRepo = orderRepo;
            _notificationRepo = notificationRepo;
            _hubContext = hubContext;
            _context = context;
        }

        [HttpGet("vendors/pending")]
        public async Task<IActionResult> GetPendingVendors()
        {
            var vendors = await _userRepo.GetVendorsAsync(isApproved: false);
            return Ok(vendors.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.StoreName,
                u.StoreDescription,
                u.IsApproved,
                u.IsActive,
                u.CreatedAt
            }));
        }

        [HttpGet("vendors/approved")]
        public async Task<IActionResult> GetApprovedVendors()
        {
            var vendors = await _userRepo.GetVendorsAsync(isApproved: true);
            return Ok(vendors.Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.StoreName,
                u.IsActive
            }));
        }

        [HttpPut("vendors/{id:guid}/approve")]
        public async Task<IActionResult> ApproveVendor(Guid id)
        {
            var vendor = await _userRepo.GetByIdAsync(id);
            if (vendor == null || vendor.Role != "Vendor")
                return NotFound(new { message = "Vendor not found" });

            vendor.IsApproved = true;
            vendor.IsActive = true;

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = vendor.Id,
                Title = "Account Approved",
                Message = "Your vendor account has been approved by the admin",
                Type = "AccountApproved",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            _userRepo.Update(vendor);
            await _userRepo.SaveChangesAsync();
            await _notificationRepo.SaveChangesAsync();

            // Send real-time notification to vendor
            await _hubContext.Clients.Group(vendor.Id.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    isRead = false,
                    createdAt = notification.CreatedAt
                });

            return Ok(new { message = "Vendor approved successfully" });
        }

        [HttpPut("vendors/{id:guid}/reject")]
        public async Task<IActionResult> RejectVendor(Guid id, [FromQuery] string? reason)
        {
            var vendor = await _userRepo.GetByIdAsync(id);
            if (vendor == null || vendor.Role != "Vendor")
                return NotFound(new { message = "Vendor not found" });

            vendor.IsApproved = false;
            vendor.IsActive = false;

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = vendor.Id,
                Title = "Account Rejected",
                Message = string.IsNullOrWhiteSpace(reason)
                    ? "Your vendor account has been rejected by the admin"
                    : $"Your vendor account has been rejected: {reason}",
                Type = "AccountRejected",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            _userRepo.Update(vendor);
            await _userRepo.SaveChangesAsync();
            await _notificationRepo.SaveChangesAsync();

            // Send real-time notification to vendor
            await _hubContext.Clients.Group(vendor.Id.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    isRead = false,
                    createdAt = notification.CreatedAt
                });

            return Ok(new { message = "Vendor rejected successfully" });
        }

        [HttpGet("products/pending")]
        public async Task<IActionResult> GetPendingProducts()
        {
            var products = await _productRepo.GetPendingProductsAsync();
            return Ok(products.Select(p => new
            {
                p.Id,
                p.Title,
                p.Description,
                p.Price,
                p.Stock,
                p.Status,
                p.CreatedAt,
                CategoryName = p.Category.Name,
                VendorId = p.VendorId,
                VendorName = p.Vendor.FullName,
                p.RejectionReason,
                Images = p.ProductImages.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).ToList()
            }));
        }

        [HttpPut("products/{id:guid}/approve")]
        public async Task<IActionResult> ApproveProduct(Guid id)
        {
            var product = await _productRepo.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.Status = "Approved";
            product.RejectionReason = null;
            product.UpdatedAt = DateTime.UtcNow;

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = product.VendorId,
                Title = "Product Approved",
                Message = $"Your product \"{product.Title}\" has been approved",
                Type = "ProductApproved",
                RelatedEntityId = product.Id,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            _productRepo.Update(product);
            await _productRepo.SaveChangesAsync();
            await _notificationRepo.SaveChangesAsync();

            // Send real-time notification to vendor
            await _hubContext.Clients.Group(product.VendorId.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    relatedEntityId = product.Id,
                    isRead = false,
                    createdAt = notification.CreatedAt
                });

            // Broadcast to all clients that a new product is approved (so Home page updates)
            await _hubContext.Clients.All
                .SendAsync("ProductApproved", new
                {
                    id = product.Id,
                    title = product.Title,
                    price = product.Price,
                    stock = product.Stock
                });

            return Ok(new { message = "Product approved successfully" });
        }

        [HttpPut("products/{id:guid}/reject")]
        public async Task<IActionResult> RejectProduct(Guid id, [FromQuery] string? reason)
        {
            if (string.IsNullOrWhiteSpace(reason))
                return BadRequest(new { message = "Reason is required when rejecting a product" });

            var product = await _productRepo.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.Status = "Rejected";
            product.RejectionReason = reason.Trim();
            product.UpdatedAt = DateTime.UtcNow;

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = product.VendorId,
                Title = "Product Rejected",
                Message = $"Your product \"{product.Title}\" was rejected: {reason.Trim()}",
                Type = "ProductRejected",
                RelatedEntityId = product.Id,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            _productRepo.Update(product);
            await _productRepo.SaveChangesAsync();
            await _notificationRepo.SaveChangesAsync();

            // Send real-time notification to vendor
            await _hubContext.Clients.Group(product.VendorId.ToString())
                .SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    relatedEntityId = product.Id,
                    isRead = false,
                    createdAt = notification.CreatedAt
                });

            return Ok(new { message = "Product rejected successfully" });
        }

        [HttpPost("permissions")]
        public async Task<IActionResult> GrantPermission([FromBody] SetVendorPermissionDto dto)
        {
            var adminId = GetCurrentAdminId();
            if (adminId == null)
                return Unauthorized(new { message = "Invalid admin token" });

            if (dto.VendorId.HasValue)
            {
                var vendor = await _userRepo.GetByIdAsync(dto.VendorId.Value);
                if (vendor == null || vendor.Role != "Vendor")
                    return BadRequest(new { message = "Vendor not found" });
            }

            var permission = new VendorPermission
            {
                Id = Guid.NewGuid(),
                VendorId = dto.VendorId,
                PermissionKey = dto.PermissionKey.Trim(),
                IsGranted = true,
                AppliedBy = adminId.Value,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepo.AddPermissionAsync(permission);
            await _userRepo.SaveChangesAsync();

            return Ok(new { message = "Permission granted successfully" });
        }

        [HttpGet("permissions/vendors")]
        public async Task<IActionResult> GetVendorsPermissions()
        {
            var permissionKeys = new[] { "CanPostProducts", "CanViewAnalytics", "CanManageStock" };
            var vendors = await _userRepo.GetVendorsAsync(isApproved: true);
            var vendorIds = vendors.Select(v => v.Id).ToList();

            var permissionRows = await _context.VendorPermissions
                .Where(p => p.VendorId.HasValue && vendorIds.Contains(p.VendorId.Value))
                .ToListAsync();

            var latestPermissions = permissionRows
                .GroupBy(p => new { p.VendorId, p.PermissionKey })
                .ToDictionary(
                    g => (g.Key.VendorId, g.Key.PermissionKey),
                    g => g.OrderByDescending(p => p.CreatedAt).First().IsGranted);

            var response = vendors.Select(v => new
            {
                v.Id,
                Name = v.FullName,
                v.Email,
                v.StoreName,
                v.IsActive,
                Permissions = permissionKeys.ToDictionary(
                    key => key,
                    key => latestPermissions.TryGetValue((v.Id, key), out var isGranted) ? isGranted : true)
            });

            return Ok(response);
        }

        [HttpDelete("permissions")]
        public async Task<IActionResult> RevokePermission([FromBody] SetVendorPermissionDto dto)
        {
            var adminId = GetCurrentAdminId();
            if (adminId == null)
                return Unauthorized(new { message = "Invalid admin token" });

            if (dto.VendorId.HasValue)
            {
                var vendor = await _userRepo.GetByIdAsync(dto.VendorId.Value);
                if (vendor == null || vendor.Role != "Vendor")
                    return BadRequest(new { message = "Vendor not found" });
            }

            var permission = new VendorPermission
            {
                Id = Guid.NewGuid(),
                VendorId = dto.VendorId,
                PermissionKey = dto.PermissionKey.Trim(),
                IsGranted = false,
                AppliedBy = adminId.Value,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepo.AddPermissionAsync(permission);
            await _userRepo.SaveChangesAsync();

            return Ok(new { message = "Permission revoked successfully" });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var vendors = await _userRepo.GetVendorsAsync();
            var customers = await _userRepo.GetCustomersAsync();
            var products = await _productRepo.GetAllAsync();
            var orders = await _orderRepo.GetAllAsync();
            var totalRevenue = orders.Sum(o => o.TotalAmount);

            return Ok(new
            {
                vendors = vendors.Count(),
                customers = customers.Count(),
                products = products.Count(),
                orders = orders.Count(),
                revenue = totalRevenue
            });
        }

        private Guid? GetCurrentAdminId()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdValue, out var adminId) ? adminId : null;
        }
    }
}
