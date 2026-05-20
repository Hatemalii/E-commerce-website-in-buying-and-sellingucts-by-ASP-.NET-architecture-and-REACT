using VendorHub.API.DTOs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Services.Implementations
{
    public class FavoritesService : IFavoritesService
    {
        private readonly IFavoriteRepository _favoriteRepo;
        private readonly IProductRepository _productRepo;

        public FavoritesService(IFavoriteRepository favoriteRepo, IProductRepository productRepo)
        {
            _favoriteRepo = favoriteRepo;
            _productRepo = productRepo;
        }

        public async Task<List<FavoriteItemDto>> GetCustomerFavorites(Guid customerId)
        {
            var favorites = await _favoriteRepo.GetCustomerFavoritesAsync(customerId);
            return favorites.Select(f => new FavoriteItemDto
            {
                ProductId = f.ProductId,
                Title = f.Product.Title,
                Price = f.Product.Price,
                Stock = f.Product.Stock,
                CategoryName = f.Product.Category?.Name ?? "",
                VendorName = f.Product.Vendor?.FullName ?? "",
                StoreName = f.Product.Vendor?.StoreName,
                ImageUrl = f.Product.ProductImages?.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                ViewerCount = f.Product.ViewerCount,
                AverageRating = f.Product.Reviews?.Any() == true ? f.Product.Reviews.Average(r => (double)r.Rating) : 0,
                ReviewCount = f.Product.Reviews?.Count ?? 0,
                AddedAt = f.CreatedAt
            }).ToList();
        }

        public async Task<FavoriteItemDto> Add(Guid customerId, AddFavoriteDto dto)
        {
            var exists = await _favoriteRepo.IsFavoriteExistsAsync(customerId, dto.ProductId);
            if (exists)
                throw new Exception("Product already in favorites");

            var product = await _productRepo.GetByIdAsync(dto.ProductId);
            if (product == null)
                throw new Exception("Product not found");

            var favorite = new Favorite
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                ProductId = dto.ProductId,
                CreatedAt = DateTime.UtcNow
            };

            await _favoriteRepo.AddAsync(favorite);
            await _favoriteRepo.SaveChangesAsync();

            return new FavoriteItemDto
            {
                ProductId = favorite.ProductId,
                Title = product.Title,
                Price = product.Price,
                Stock = product.Stock,
                CategoryName = product.Category?.Name ?? "",
                VendorName = product.Vendor?.FullName ?? "",
                StoreName = product.Vendor?.StoreName,
                ImageUrl = product.ProductImages?.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault(),
                ViewerCount = product.ViewerCount,
                AverageRating = product.Reviews?.Any() == true ? product.Reviews.Average(r => (double)r.Rating) : 0,
                ReviewCount = product.Reviews?.Count ?? 0,
                AddedAt = favorite.CreatedAt
            };
        }

        public async Task<bool> Remove(Guid customerId, Guid productId)
        {
            var favorite = await _favoriteRepo.GetFavoriteAsync(customerId, productId);
            if (favorite == null)
                return false;

            _favoriteRepo.Delete(favorite);
            await _favoriteRepo.SaveChangesAsync();
            return true;
        }
    }
}