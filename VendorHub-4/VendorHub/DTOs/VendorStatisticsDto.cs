namespace VendorHub.API.DTOs
{
    public class VendorStatisticsDto
    {
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public int TotalUnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AverageRating { get; set; }
        public TopProductDto? TopProduct { get; set; }
        public List<MonthlySalesDto> MonthlySales { get; set; } = new();
    }

    public class TopProductDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int UnitsSold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class MonthlySalesDto
    {
        public string Month { get; set; } = string.Empty;
        public int OrdersCount { get; set; }
        public decimal Revenue { get; set; }
    }
}