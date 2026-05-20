using Microsoft.EntityFrameworkCore;
using VendorHub.API.Data;
using VendorHub.API.Models;

namespace VendorHub.API.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IEnumerable<User>> GetVendorsAsync(bool? isApproved = null)
        {
            var query = _dbSet.Where(u => u.Role == "Vendor");

            if (isApproved.HasValue)
                query = query.Where(u => u.IsApproved == isApproved.Value);

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<User>> GetCustomersAsync()
        {
            return await _dbSet.Where(u => u.Role == "Customer").ToListAsync();
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _dbSet.AnyAsync(u => u.Email == email);
        }

        public async Task AddPermissionAsync(VendorPermission permission)
        {
            await _context.VendorPermissions.AddAsync(permission);
        }

        public async Task<bool> HasVendorPermissionAsync(Guid vendorId, string permissionKey)
        {
            var latestPermission = await _context.VendorPermissions
                .Where(p => p.VendorId == vendorId && p.PermissionKey == permissionKey)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            return latestPermission?.IsGranted ?? true;
        }

        public async Task<IEnumerable<User>> GetAdminsAsync()
        {
            return await _dbSet.Where(u => u.Role == "Admin" && u.IsActive).ToListAsync();
        }
    }
}
