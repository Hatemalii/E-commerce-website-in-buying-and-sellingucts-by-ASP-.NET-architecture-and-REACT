using VendorHub.API.DTOs;

namespace VendorHub.API.Services.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationResponseDto>> GetUserNotificationsAsync(Guid userId);
        Task<int> GetUnreadCountAsync(Guid userId);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
        Task CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedEntityId = null);
    }
}