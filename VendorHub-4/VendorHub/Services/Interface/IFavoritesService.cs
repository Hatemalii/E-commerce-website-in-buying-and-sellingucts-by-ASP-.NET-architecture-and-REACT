using VendorHub.API.DTOs;

namespace VendorHub.API.Services.Interface
{
    public interface IFavoritesService
    {
        Task<List<FavoriteItemDto>> GetCustomerFavorites(Guid customerId);
        Task<FavoriteItemDto> Add(Guid customerId, AddFavoriteDto dto);
        Task<bool> Remove(Guid customerId, Guid productId);
    }
}
