using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<IEnumerable<User>> GetVendorsAsync(bool? isApproved = null);
        Task<IEnumerable<User>> GetCustomersAsync();
        Task<bool> IsEmailExistsAsync(string email);
        Task AddPermissionAsync(VendorPermission permission);
        Task<bool> HasVendorPermissionAsync(Guid vendorId, string permissionKey);
        Task<IEnumerable<User>> GetAdminsAsync();
    }
}
