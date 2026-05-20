namespace VendorHub.API.Models
{
    public class Review
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid ProductId { get; set; }
        public Guid OrderItemId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public User Customer { get; set; } = null!;
        public Product Product { get; set; } = null!;
        public OrderItem OrderItem { get; set; } = null!;
    }
}