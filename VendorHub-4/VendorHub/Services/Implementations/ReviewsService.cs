using VendorHub.API.DTOs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Services.Implementations
{
    public class ReviewsService : IReviewsService
    {
        private readonly IReviewRepository _reviewRepo;
        private readonly IProductRepository _productRepo;
        private readonly IOrderRepository _orderRepo;
        private readonly IUserRepository _userRepo;

        public ReviewsService(
            IReviewRepository reviewRepo,
            IProductRepository productRepo,
            IOrderRepository orderRepo,
            IUserRepository userRepo)
        {
            _reviewRepo = reviewRepo;
            _productRepo = productRepo;
            _orderRepo = orderRepo;
            _userRepo = userRepo;
        }

        public async Task<List<ReviewItemDto>> GetProductReviews(Guid productId)
        {
            var reviews = await _reviewRepo.GetProductReviewsAsync(productId);
            return reviews.Select(r => new ReviewItemDto
            {
                Id = r.Id,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer.FullName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToList();
        }

        public async Task<ReviewItemDto> Create(Guid customerId, CreateReviewDto dto)
        {
            var customer = await _userRepo.GetByIdAsync(customerId);
            if (customer == null)
                throw new Exception("Customer not found");

            var product = await _productRepo.GetByIdAsync(dto.ProductId);
            if (product == null)
                throw new Exception("Product not found");

            var orderItem = await _orderRepo.GetOrderItemByIdAsync(dto.OrderItemId);
            if (orderItem == null || orderItem.Order.CustomerId != customerId || orderItem.ProductId != dto.ProductId)
                throw new Exception("You can only review products you have purchased");

            var reviewableStatuses = new[] { "Paid", "Completed", "Delivered" };
            if (!reviewableStatuses.Contains(orderItem.Order.Status, StringComparer.OrdinalIgnoreCase))
                throw new Exception("You can review this product after the order is paid");

            var existingReview = await _reviewRepo.HasCustomerReviewedProductAsync(customerId, dto.ProductId);
            if (existingReview)
                throw new Exception("You have already reviewed this product");

            var review = new Review
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                ProductId = dto.ProductId,
                OrderItemId = orderItem.Id,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            await _reviewRepo.AddAsync(review);
            await _reviewRepo.SaveChangesAsync();

            return new ReviewItemDto
            {
                Id = review.Id,
                CustomerId = review.CustomerId,
                CustomerName = customer.FullName,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }
    }
}
