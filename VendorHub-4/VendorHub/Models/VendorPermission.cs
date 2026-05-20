namespace VendorHub.API.Models
{
    public class VendorPermission
    {
        public Guid Id { get; set; }
        public Guid? VendorId { get; set; }
        public string PermissionKey { get; set; } = string.Empty;
        public bool IsGranted { get; set; }
        public Guid AppliedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public User? Vendor { get; set; }
        public User AppliedByAdmin { get; set; } = null!;
    }
}