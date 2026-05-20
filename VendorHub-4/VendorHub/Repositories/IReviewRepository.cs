using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public interface IReviewRepository : IGenericRepository<Review>
    {
        Task<IEnumerable<Review>> GetProductReviewsAsync(Guid productId);
        Task<double> GetAverageRatingForProductAsync(Guid productId);
        Task<bool> HasCustomerReviewedProductAsync(Guid customerId, Guid productId);
    }
}