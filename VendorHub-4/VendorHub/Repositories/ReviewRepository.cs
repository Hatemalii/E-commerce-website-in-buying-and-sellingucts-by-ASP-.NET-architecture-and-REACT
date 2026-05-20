using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public class ReviewRepository : GenericRepository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Review>> GetProductReviewsAsync(Guid productId)
        {
            return await _dbSet
                .Where(r => r.ProductId == productId)
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<double> GetAverageRatingForProductAsync(Guid productId)
        {
            var reviews = await _dbSet
                .Where(r => r.ProductId == productId)
                .ToListAsync();

            return reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        }

        public async Task<bool> HasCustomerReviewedProductAsync(Guid customerId, Guid productId)
        {
            return await _dbSet.AnyAsync(r => r.CustomerId == customerId && r.ProductId == productId);
        }
    }
}