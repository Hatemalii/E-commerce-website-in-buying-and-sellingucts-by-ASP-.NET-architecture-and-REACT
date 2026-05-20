namespace VendorHub.API.DTOs
{
    public class FavoriteItemDto
    {
        public Guid ProductId { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public string? StoreName { get; set; }
        public string? ImageUrl { get; set; }
        public int ViewerCount { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public DateTime AddedAt { get; set; }
    }

    public class AddFavoriteDto
    {
        public Guid ProductId { get; set; }
    }
}
