using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.DTOs;
using VendorHub.API.Models;
using VendorHub.API.Repositories; // <-- هام: استخدام الـ Repository
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Services.Implementations
{
    public class ProductsService : IProductsService
    {
        // ✅ بدل useContext مباشر، بنستخدم الـ Repositories
        private readonly IProductRepository _productRepo;
        private readonly ICategoryRepository _categoryRepo;
        private readonly IUserRepository _userRepo;
        private readonly IReviewRepository _reviewRepo;
        private readonly AppDbContext _context;

        // ✅ Constructor الجديد (Dependency Injection للـ Repositories)
        public ProductsService(
            IProductRepository productRepo,
            ICategoryRepository categoryRepo,
            IUserRepository userRepo,
            IReviewRepository reviewRepo,
            AppDbContext context)
        {
            _productRepo = productRepo;
            _categoryRepo = categoryRepo;
            _userRepo = userRepo;
            _reviewRepo = reviewRepo;
            _context = context;
        }

        // ✅ GetAll (مش محتاج تغيير كبير، شغال مع Query builder)
        public async Task<object> GetAll(ProductQueryDto query)
        {
            if (query.Page < 1) query.Page = 1;
            if (query.PageSize < 1) query.PageSize = 12;
            if (query.PageSize > 50) query.PageSize = 50;

            // 👈 الـ ProductsQuery هنحطه تحت التعديل بعد كدة، بس دلوقتي هنستخدم Repository Pattern

            var productsQuery = (await _productRepo.GetApprovedProductsAsync()).AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim().ToLower();
                productsQuery = productsQuery.Where(p =>
                    p.Title.ToLower().Contains(search) ||
                    (p.Description != null && p.Description.ToLower().Contains(search)));
            }

            if (query.CategoryId.HasValue)
                productsQuery = productsQuery.Where(p => p.CategoryId == query.CategoryId.Value);

            if (query.MinPrice.HasValue)
                productsQuery = productsQuery.Where(p => p.Price >= query.MinPrice.Value);

            if (query.MaxPrice.HasValue)
                productsQuery = productsQuery.Where(p => p.Price <= query.MaxPrice.Value);

            var sortBy = query.SortBy?.Trim().ToLower();
            productsQuery = sortBy switch
            {
                "priceasc" => productsQuery.OrderBy(p => p.Price),
                "pricedesc" => productsQuery.OrderByDescending(p => p.Price),
                "views" => productsQuery.OrderByDescending(p => p.ViewerCount),
                _ => productsQuery.OrderByDescending(p => p.CreatedAt)
            };

            var totalCount = productsQuery.Count();

            var items = productsQuery
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(p => new ProductListItemDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Price = p.Price,
                    Stock = p.Stock,
                    ViewerCount = p.ViewerCount,
                    CategoryName = p.Category.Name,
                    VendorName = p.Vendor.FullName,
                    StoreName = p.Vendor.StoreName,
                    ThumbnailUrl = p.ProductImages.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                    AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double)r.Rating) : 0,
                    ReviewCount = p.Reviews.Count,
                    CreatedAt = p.CreatedAt
                })
                .ToList();

            return new
            {
                items,
                totalCount,
                page = query.Page,
                pageSize = query.PageSize,
                totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize)
            };
        }

        // ✅ GetById (باستخدام الـ Repository)
        public async Task<ProductDetailDto?> GetById(Guid productId, Guid? viewerUserId = null)
        {
            // الـ Repository بيجيب تفاصيل المنتج بالعلاقات
            var product = await _productRepo.GetProductWithDetailsAsync(productId);
            if (product == null || product.Status != "Approved")
                return null;

            // تحديث عدد المشاهدات (ViewerCount)
            if (!viewerUserId.HasValue || viewerUserId.Value != product.VendorId)
            {
                product.ViewerCount++;
                await _productRepo.SaveChangesAsync();
            }

            return MapProductDetail(product);
        }

        // ✅ GetVendorProducts (باستخدام الـ Repository)
        public async Task<object> GetVendorProducts(Guid vendorId)
        {
            try
            {
                var products = (await _productRepo.GetByVendorIdAsync(vendorId)).ToList();

                var stats = new
                {
                    approvedProducts = products.Count(p => p.Status != null && p.Status.Equals("Approved", StringComparison.OrdinalIgnoreCase)),
                    pendingProducts = products.Count(p => p.Status != null && p.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase)),
                    rejectedProducts = products.Count(p => p.Status != null && p.Status.Equals("Rejected", StringComparison.OrdinalIgnoreCase)),
                    totalSales = products.Sum(p => p.OrderItems?.Sum(oi => oi.Quantity) ?? 0),
                    totalRevenue = products.Sum(p => p.OrderItems?.Sum(oi => oi.Quantity * oi.UnitPrice) ?? 0),
                };

                var productList = products.Select(p => new VendorProductItemDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Price = p.Price,
                    Stock = p.Stock,
                    ViewerCount = p.ViewerCount,
                    Status = p.Status,
                    RejectionReason = p.RejectionReason,
                    CategoryName = p.Category?.Name ?? "Uncategorized",
                    ThumbnailUrl = p.ProductImages?.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                }).ToList();

                return new
                {
                    stats,
                    products = productList
                };
            }
            catch (Exception ex)
            {
                // Detailed logging would go here
                throw new Exception($"Error in GetVendorProducts for vendor {vendorId}: {ex.Message}", ex);
            }
        }

        // ✅ Create (باستخدام الـ Repository)
        public async Task<ProductDetailDto> Create(Guid vendorId, CreateProductDto dto)
        {
            var vendor = await _userRepo.GetByIdAsync(vendorId);
            if (vendor == null || vendor.Role != "Vendor")
                throw new Exception("Vendor not found");

            if (!vendor.IsApproved) throw new Exception("Vendor is not approved yet");
            if (!vendor.IsActive) throw new Exception("Vendor account is inactive");
            if (!await _userRepo.HasVendorPermissionAsync(vendorId, "CanPostProducts"))
                throw new Exception("You do not have permission to post products.");

            var categoryExists = await _categoryRepo.AnyAsync(c => c.Id == dto.CategoryId);
            if (!categoryExists) throw new Exception("Category not found");

            var product = new Product
            {
                Id = Guid.NewGuid(),
                VendorId = vendorId,
                CategoryId = dto.CategoryId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                Stock = dto.Stock,
                Status = "Pending",
                ViewerCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            await _productRepo.AddAsync(product);
            await _productRepo.SaveChangesAsync();

            if (dto.ImagesBase64 != null && dto.ImagesBase64.Any())
            {
                var displayOrder = 1;
                foreach (var imgStr in dto.ImagesBase64)
                {
                    if (string.IsNullOrWhiteSpace(imgStr)) continue;
                    
                    var productImage = new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        ImageUrl = imgStr.Trim(),
                        DisplayOrder = displayOrder++
                    };
                    await _context.ProductImages.AddAsync(productImage);
                }
                await _productRepo.SaveChangesAsync();
            }

            return await GetVendorProductDetail(product.Id, vendorId) ?? throw new Exception("Product created but could not be loaded");
        }

        // ✅ Delete (باستخدام الـ Repository)
        public async Task<bool> Delete(Guid vendorId, Guid productId)
        {
            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.VendorId != vendorId)
                return false;

            // التحقق من وجود Orders
            var hasOrders = await _productRepo.HasOrdersAsync(productId); // هتضيفها في Interface
            if (hasOrders) throw new Exception("Cannot delete product because it has related orders");

            _productRepo.Delete(product);
            await _productRepo.SaveChangesAsync();
            return true;
        }

        public async Task<ProductDetailDto?> Update(Guid vendorId, Guid productId, UpdateProductDto dto)
        {
            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.VendorId != vendorId) return null;
            if (product.Stock != dto.Stock && !await _userRepo.HasVendorPermissionAsync(vendorId, "CanManageStock"))
                throw new Exception("You do not have permission to manage stock.");

            product.Title = dto.Title;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.Stock = dto.Stock;
            product.CategoryId = dto.CategoryId;
            product.UpdatedAt = DateTime.UtcNow;

            // Update Images
            if (dto.ImagesBase64 != null)
            {
                // Simple strategy: Clear old and add new
                var oldImages = await _context.ProductImages.Where(pi => pi.ProductId == productId).ToListAsync();
                _context.ProductImages.RemoveRange(oldImages);

                var displayOrder = 1;
                foreach (var imgStr in dto.ImagesBase64)
                {
                    if (string.IsNullOrWhiteSpace(imgStr)) continue;
                    var productImage = new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        ImageUrl = imgStr.Trim(),
                        DisplayOrder = displayOrder++
                    };
                    await _context.ProductImages.AddAsync(productImage);
                }
            }

            await _productRepo.SaveChangesAsync();
            return await GetVendorProductDetail(productId, vendorId);
        }

        public async Task<VendorStatisticsDto> GetVendorStatisticsAsync(Guid vendorId)
        {
            return new VendorStatisticsDto();
        }

        // ... باقي دوال المساعدة (SaveBase64Image...)
        private async Task<ProductDetailDto?> GetVendorProductDetail(Guid productId, Guid vendorId)
        {
            var product = await _productRepo.GetProductWithDetailsAsync(productId);
            if (product == null || product.VendorId != vendorId) return null;
            return MapProductDetail(product);
        }

        private static ProductDetailDto MapProductDetail(Product product)
        {
            // نفس الكود القديم
            return new ProductDetailDto
            {
                Id = product.Id,
                VendorId = product.VendorId,
                CategoryId = product.CategoryId,
                Title = product.Title,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                ViewerCount = product.ViewerCount,
                Status = product.Status,
                RejectionReason = product.RejectionReason,
                CategoryName = product.Category.Name,
                VendorName = product.Vendor.FullName,
                StoreName = product.Vendor.StoreName,
                StoreDescription = product.Vendor.StoreDescription,
                AverageRating = product.Reviews.Any() ? product.Reviews.Average(r => (double)r.Rating) : 0,
                ReviewCount = product.Reviews.Count,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                Images = product.ProductImages.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto { Id = i.Id, ImageUrl = i.ImageUrl, DisplayOrder = i.DisplayOrder }).ToList(),
                Reviews = product.Reviews.OrderByDescending(r => r.CreatedAt).Select(r => new ProductReviewDto
                {
                    Id = r.Id,
                    CustomerId = r.CustomerId,
                    CustomerName = r.Customer.FullName,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                }).ToList()
            };
        }
    }
}
