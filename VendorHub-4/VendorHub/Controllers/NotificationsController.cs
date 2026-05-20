using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VendorHub.API.Services.Interfaces;
using VendorHub.API.Repositories;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationRepository _notificationRepo;

        public NotificationsController(INotificationRepository notificationRepo)
        {
            _notificationRepo = notificationRepo;
        }

        private Guid GetCurrentUserId()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.Parse(userIdValue);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = GetCurrentUserId();
            var notifications = await _notificationRepo.GetUserNotificationsAsync(userId);
            return Ok(notifications.Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.RelatedEntityId,
                n.CreatedAt
            }));
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            var count = await _notificationRepo.GetUnreadCountAsync(userId);
            return Ok(new { unreadCount = count });
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = GetCurrentUserId();
            await _notificationRepo.MarkAsReadAsync(id, userId);
            return Ok(new { message = "Marked as read" });
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            await _notificationRepo.MarkAllAsReadAsync(userId);
            return Ok(new { message = "All notifications marked as read" });
        }
    }
}