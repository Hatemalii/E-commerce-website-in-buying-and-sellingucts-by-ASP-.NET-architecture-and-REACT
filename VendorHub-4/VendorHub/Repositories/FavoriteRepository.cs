using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public class FavoriteRepository : GenericRepository<Favorite>, IFavoriteRepository
    {
        public FavoriteRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Favorite>> GetCustomerFavoritesAsync(Guid customerId)
        {
            return await _dbSet
                .Where(f => f.CustomerId == customerId)
                .Include(f => f.Product)
                    .ThenInclude(p => p.ProductImages)
                .Include(f => f.Product)
                    .ThenInclude(p => p.Category)
                .Include(f => f.Product)
                    .ThenInclude(p => p.Vendor)
                .ToListAsync();
        }

        public async Task<Favorite?> GetFavoriteAsync(Guid customerId, Guid productId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(f => f.CustomerId == customerId && f.ProductId == productId);
        }

        public async Task<bool> IsFavoriteExistsAsync(Guid customerId, Guid productId)
        {
            return await _dbSet.AnyAsync(f => f.CustomerId == customerId && f.ProductId == productId);
        }
    }
}