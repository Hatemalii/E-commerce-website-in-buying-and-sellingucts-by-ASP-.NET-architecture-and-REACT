using VendorHub.API.DTOs;

namespace VendorHub.API.Services.Interface
{
    public interface IProductsService
    {
        Task<object> GetAll(ProductQueryDto query);
        Task<ProductDetailDto?> GetById(Guid productId, Guid? viewerUserId = null);
        Task<object> GetVendorProducts(Guid vendorId);
        Task<ProductDetailDto> Create(Guid vendorId, CreateProductDto dto);
        Task<ProductDetailDto?> Update(Guid vendorId, Guid productId, UpdateProductDto dto);
        Task<bool> Delete(Guid vendorId, Guid productId);
        Task<VendorStatisticsDto> GetVendorStatisticsAsync(Guid vendorId);
    }
}
