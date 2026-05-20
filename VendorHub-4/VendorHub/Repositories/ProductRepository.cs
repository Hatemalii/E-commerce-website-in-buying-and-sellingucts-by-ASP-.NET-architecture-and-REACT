using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public class ProductRepository : GenericRepository<Product>, IProductRepository
    {
        public ProductRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Product>> GetByVendorIdAsync(Guid vendorId)
        {
            return await _dbSet
                .Where(p => p.VendorId == vendorId)
                .Include(p => p.Category)
                .Include(p => p.ProductImages)
                .Include(p => p.OrderItems)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetApprovedProductsAsync()
        {
            return await _dbSet
                .Where(p => p.Status == "Approved" && p.Stock > 0)
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .Include(p => p.ProductImages)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetPendingProductsAsync()
        {
            return await _dbSet
                .Where(p => p.Status == "Pending")
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .Include(p => p.ProductImages)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetProductsWithIncludesAsync()
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .Include(p => p.ProductImages)
                .Include(p => p.Reviews)
                .ToListAsync();
        }

        public async Task<Product?> GetProductWithDetailsAsync(Guid id)
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.Vendor)
                .Include(p => p.ProductImages)
                .Include(p => p.Reviews)
                    .ThenInclude(r => r.Customer)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<bool> HasOrdersAsync(Guid productId)
        {
            return await _context.OrderItems.AnyAsync(oi => oi.ProductId == productId);
        }
    }
}