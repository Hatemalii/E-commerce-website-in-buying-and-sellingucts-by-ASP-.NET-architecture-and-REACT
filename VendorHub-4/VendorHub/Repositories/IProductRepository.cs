using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public interface IProductRepository : IGenericRepository<Product>
    {
        Task<IEnumerable<Product>> GetByVendorIdAsync(Guid vendorId);
        Task<IEnumerable<Product>> GetApprovedProductsAsync();
        Task<IEnumerable<Product>> GetPendingProductsAsync();
        Task<IEnumerable<Product>> GetProductsWithIncludesAsync();
        Task<Product?> GetProductWithDetailsAsync(Guid id);
        Task<bool> HasOrdersAsync(Guid productId);
    }
}