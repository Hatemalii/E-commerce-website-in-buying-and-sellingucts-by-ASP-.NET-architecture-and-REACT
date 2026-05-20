namespace VendorHub.API.DTOs
{
    public class OrderResponseDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemResponseDto> Items { get; set; }
    }

    public class OrderItemResponseDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string ProductTitle { get; set; }
        public Guid VendorId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public bool HasReviewed { get; set; }
        public decimal Subtotal => Quantity * UnitPrice;
    }
}
