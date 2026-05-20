namespace VendorHub.API.Models
{
    public class Favorite
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid ProductId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public User Customer { get; set; } = null!;
        public Product Product { get; set; } = null!;
    }
}