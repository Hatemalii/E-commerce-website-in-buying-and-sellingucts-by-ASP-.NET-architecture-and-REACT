using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public interface IFavoriteRepository : IGenericRepository<Favorite>
    {
        Task<IEnumerable<Favorite>> GetCustomerFavoritesAsync(Guid customerId);
        Task<Favorite?> GetFavoriteAsync(Guid customerId, Guid productId);
        Task<bool> IsFavoriteExistsAsync(Guid customerId, Guid productId);
    }
}