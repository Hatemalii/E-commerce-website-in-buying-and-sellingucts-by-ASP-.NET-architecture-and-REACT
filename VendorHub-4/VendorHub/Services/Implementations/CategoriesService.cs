using VendorHub.API.DTOs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Services.Implementations
{
    public class CategoriesService : ICategoriesService
    {
        private readonly ICategoryRepository _categoryRepo;
        private readonly IProductRepository _productRepo;

        public CategoriesService(ICategoryRepository categoryRepo, IProductRepository productRepo)
        {
            _categoryRepo = categoryRepo;
            _productRepo = productRepo;
        }

        public async Task<List<Category>> GetAllAsync()
        {
            var categories = await _categoryRepo.GetAllAsync();
            return categories.ToList();
        }

        public async Task<Category> CreateAsync(CreateCategoryDto dto)
        {
            var name = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new Exception("Category name is required");

            var categories = await _categoryRepo.GetAllAsync();
            if (categories.Any(c => c.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
                throw new Exception("Category already exists");

            var category = new Category
            {
                Name = name
            };

            await _categoryRepo.AddAsync(category);
            await _categoryRepo.SaveChangesAsync();

            return category;
        }

        public async Task DeleteAsync(int id)
        {
            var category = await _categoryRepo.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
                throw new Exception("Category not found");

            var hasProducts = await _productRepo.AnyAsync(p => p.CategoryId == id);
            if (hasProducts)
                throw new Exception("Cannot delete this category because it is used by products");

            _categoryRepo.Delete(category);
            await _categoryRepo.SaveChangesAsync();
        }
    }
}
