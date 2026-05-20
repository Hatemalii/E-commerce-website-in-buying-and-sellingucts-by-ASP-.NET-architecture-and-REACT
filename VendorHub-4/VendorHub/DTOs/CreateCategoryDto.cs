using System.ComponentModel.DataAnnotations;

namespace VendorHub.API.DTOs
{
    public class CreateCategoryDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
    }
}
