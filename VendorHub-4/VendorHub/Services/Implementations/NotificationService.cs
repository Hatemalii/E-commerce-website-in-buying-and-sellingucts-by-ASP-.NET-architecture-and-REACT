using VendorHub.API.DTOs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using VendorHub.API.Hubs;

namespace VendorHub.API.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(INotificationRepository notificationRepo, IHubContext<NotificationHub> hubContext)
        {
            _notificationRepo = notificationRepo;
            _hubContext = hubContext;
        }

        public async Task<List<NotificationResponseDto>> GetUserNotificationsAsync(Guid userId)
        {
            var notifications = await _notificationRepo.GetUserNotificationsAsync(userId);
            return notifications.Select(n => new NotificationResponseDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                RelatedEntityId = n.RelatedEntityId,
                CreatedAt = n.CreatedAt
            }).ToList();
        }

        public async Task<int> GetUnreadCountAsync(Guid userId)
        {
            return await _notificationRepo.GetUnreadCountAsync(userId);
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            await _notificationRepo.MarkAsReadAsync(notificationId, userId);
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            await _notificationRepo.MarkAllAsReadAsync(userId);
        }

        public async Task CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedEntityId = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                RelatedEntityId = relatedEntityId,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationRepo.SaveChangesAsync();

           
            var notificationDto = new NotificationResponseDto
            {
                Id = notification.Id,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                RelatedEntityId = notification.RelatedEntityId,
                CreatedAt = notification.CreatedAt
            };

            await _hubContext.Clients.Group(userId.ToString())
                .SendAsync("ReceiveNotification", notificationDto);
        }
    }
}