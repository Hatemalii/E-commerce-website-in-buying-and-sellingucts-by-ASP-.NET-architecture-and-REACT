using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using VendorHub.API.DTOs;
using VendorHub.API.Hubs;
using VendorHub.API.Models;
using VendorHub.API.Repositories;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _configuration;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly INotificationRepository _notificationRepo;

        public AuthController(IUserRepository userRepo, IConfiguration configuration, IHubContext<NotificationHub> hubContext, INotificationRepository notificationRepo)
        {
            _userRepo = userRepo;
            _configuration = configuration;
            _hubContext = hubContext;
            _notificationRepo = notificationRepo;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var role = dto.Role.Trim();
            if (role != "Admin" && role != "Vendor" && role != "Customer")
                return BadRequest(new { message = "Role must be Admin, Vendor, or Customer" });

            if (await _userRepo.IsEmailExistsAsync(dto.Email))
                return BadRequest(new { message = "This email is already registered" });

            if (role == "Vendor" && string.IsNullOrWhiteSpace(dto.StoreName))
                return BadRequest(new { message = "Store name is required for vendor registration" });

            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = role,
                IsApproved = role != "Vendor",
                IsActive = true,
                StoreName = role == "Vendor" ? dto.StoreName?.Trim() : null,
                StoreDescription = role == "Vendor" ? dto.StoreDescription?.Trim() : null,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepo.AddAsync(user);
            await _userRepo.SaveChangesAsync();

            // Notify all Admins in real-time when a new Vendor registers
            if (role == "Vendor")
            {
                var admins = await _userRepo.GetAdminsAsync();
                foreach (var admin in admins)
                {
                    var adminNotification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = admin.Id,
                        Title = "New Vendor Registration",
                        Message = $"New vendor '{user.FullName}' ({user.StoreName}) has registered and is waiting for approval",
                        Type = "VendorRegistration",
                        RelatedEntityId = user.Id,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _notificationRepo.AddAsync(adminNotification);
                }
                await _notificationRepo.SaveChangesAsync();

                await _hubContext.Clients.Group("Admins")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = Guid.NewGuid(),
                        title = "New Vendor Registration",
                        message = $"New vendor '{user.FullName}' ({user.StoreName}) has registered and is waiting for approval",
                        type = "VendorRegistration",
                        relatedEntityId = user.Id,
                        isRead = false,
                        createdAt = DateTime.UtcNow
                    });
            }

            return Ok(new
            {
                message = role == "Vendor"
                    ? "Vendor registered successfully and is waiting for admin approval"
                    : "Registration completed successfully"
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            var user = await _userRepo.GetByEmailAsync(email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { message = "Incorrect email or password" });

            if (!user.IsActive)
                return BadRequest(new { message = "This account is inactive" });

            if (user.Role == "Vendor" && !user.IsApproved)
                return BadRequest(new { message = "Your vendor account is still pending admin approval" });

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.IsApproved,
                    user.IsActive,
                    user.StoreName,
                    user.StoreDescription,
                    user.ProfileImage
                }
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized(new { message = "Invalid token user id" });

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "Invalid token user" });

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.IsApproved,
                user.IsActive,
                user.StoreName,
                user.StoreDescription,
                user.ProfileImage,
                user.CreatedAt
            });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized(new { message = "Invalid token user id" });

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "Invalid token user" });

            user.FullName = dto.FullName.Trim();
            user.ProfileImage = string.IsNullOrWhiteSpace(dto.ProfileImage) ? null : dto.ProfileImage.Trim();

            if (user.Role == "Vendor")
            {
                user.StoreName = string.IsNullOrWhiteSpace(dto.StoreName) ? null : dto.StoreName.Trim();
                user.StoreDescription = string.IsNullOrWhiteSpace(dto.StoreDescription) ? null : dto.StoreDescription.Trim();
            }

            _userRepo.Update(user);
            await _userRepo.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully" });
        }

        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
                return Unauthorized(new { message = "Invalid token user id" });

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "Invalid token user" });

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
                return BadRequest(new { message = "Old password is incorrect" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _userRepo.Update(user);
            await _userRepo.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.Id.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}