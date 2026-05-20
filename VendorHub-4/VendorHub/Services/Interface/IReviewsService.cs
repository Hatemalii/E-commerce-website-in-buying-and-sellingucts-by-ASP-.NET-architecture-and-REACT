using VendorHub.API.DTOs;

namespace VendorHub.API.Services.Interface
{
    public interface IReviewsService
    {
        Task<List<ReviewItemDto>> GetProductReviews(Guid productId);
        Task<ReviewItemDto> Create(Guid customerId, CreateReviewDto dto);
    }
}
