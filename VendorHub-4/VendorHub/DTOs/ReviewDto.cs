using System.ComponentModel.DataAnnotations;

namespace VendorHub.API.DTOs
{
    public class CreateReviewDto
    {
        [Required]
        public Guid ProductId { get; set; }

        [Required]
        public Guid OrderItemId { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        public string? Comment { get; set; }
    }

    public class ReviewItemDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public Guid ProductId { get; set; }
        public Guid OrderItemId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
