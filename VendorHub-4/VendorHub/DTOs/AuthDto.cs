using System.ComponentModel.DataAnnotations;

namespace VendorHub.API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "Customer";

        public string? StoreName { get; set; }

        public string? StoreDescription { get; set; }
    }

    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? StoreName { get; set; }

        public string? StoreDescription { get; set; }

        public string? ProfileImage { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string OldPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class SetVendorPermissionDto
    {
        public Guid? VendorId { get; set; }

        [Required]
        public string PermissionKey { get; set; } = string.Empty;
    }
}
