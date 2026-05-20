using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using VendorHub.API.DTOs;
using VendorHub.API.Hubs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductsService _service;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly INotificationRepository _notificationRepo;
        private readonly IUserRepository _userRepo;

        public ProductsController(IProductsService service, IHubContext<NotificationHub> hubContext, INotificationRepository notificationRepo, IUserRepository userRepo)
        {
            _service = service;
            _hubContext = hubContext;
            _notificationRepo = notificationRepo;
            _userRepo = userRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ProductQueryDto query)
        {
            var products = await _service.GetAll(query);
            return Ok(products);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            Guid? viewerUserId = null;
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userIdValue, out var parsedUserId))
                viewerUserId = parsedUserId;

            var product = await _service.GetById(id, viewerUserId);

            if (product == null)
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }

        [Authorize(Roles = "Vendor")]
        [HttpGet("vendor/my")]
        public async Task<IActionResult> GetVendorProducts()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var vendorId))
                return Unauthorized(new { message = "Invalid token user id" });

            try
            {
                var result = await _service.GetVendorProducts(vendorId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Server error fetching vendor products.", detail = ex.Message });
            }
        }

        [Authorize(Roles = "Vendor")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var vendorId))
                return Unauthorized(new { message = "Invalid token user id" });

            try
            {
                var product = await _service.Create(vendorId, dto);

                // Notify all Admins that a new product needs review
                var admins = await _userRepo.GetAdminsAsync();
                foreach (var admin in admins)
                {
                    var adminNotification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = admin.Id,
                        Title = "New Product Submitted",
                        Message = $"Vendor submitted a new product '{dto.Title}' for review",
                        Type = "ProductSubmitted",
                        RelatedEntityId = product.Id,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _notificationRepo.AddAsync(adminNotification);
                }
                await _notificationRepo.SaveChangesAsync();

                await _hubContext.Clients.Group("Admins")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = Guid.NewGuid(),
                        title = "New Product Submitted",
                        message = $"Vendor submitted a new product '{dto.Title}' for review",
                        type = "ProductSubmitted",
                        relatedEntityId = product.Id,
                        isRead = false,
                        createdAt = DateTime.UtcNow
                    });

                return Ok(product);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Vendor")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductDto dto)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var vendorId))
                return Unauthorized(new { message = "Invalid token user id" });

            try
            {
                var product = await _service.Update(vendorId, id, dto);

                if (product == null)
                    return NotFound(new { message = "Product not found" });

                return Ok(product);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Vendor")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var vendorId))
                return Unauthorized(new { message = "Invalid token user id" });

            try
            {
                var deleted = await _service.Delete(vendorId, id);

                if (!deleted)
                    return NotFound(new { message = "Product not found" });

                return Ok(new { message = "Product deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }



        [Authorize(Roles = "Vendor")]
        [HttpGet("statistics")]
        public async Task<IActionResult> GetVendorStatistics()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var vendorId))
                return Unauthorized(new { message = "Invalid token user id" });

            if (!await _userRepo.HasVendorPermissionAsync(vendorId, "CanViewAnalytics"))
                return StatusCode(403, new { message = "You do not have permission to view analytics." });

            var statistics = await _service.GetVendorStatisticsAsync(vendorId);
            return Ok(statistics);
        }
    }
}
