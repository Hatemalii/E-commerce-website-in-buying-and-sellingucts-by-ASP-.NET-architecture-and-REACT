using VendorHub.API.DTOs;
using VendorHub.API.Models;

namespace VendorHub.API.Services.Interface
{
    public interface ICategoriesService
    {
        Task<List<Category>> GetAllAsync();

        Task<Category> CreateAsync(CreateCategoryDto dto);

        Task DeleteAsync(int id);
    }
}
