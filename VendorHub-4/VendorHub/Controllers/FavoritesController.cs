using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VendorHub.API.DTOs;
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoritesService _service;

        public FavoritesController(IFavoritesService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyFavorites()
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var customerId))
                return Unauthorized(new { message = "Invalid token user id" });

            var favorites = await _service.GetCustomerFavorites(customerId);
            return Ok(favorites);
        }

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddFavoriteDto dto)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var customerId))
                return Unauthorized(new { message = "Invalid token user id" });

            try
            {
                var favorite = await _service.Add(customerId, dto);
                return Ok(favorite);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{productId:guid}")]
        public async Task<IActionResult> Remove(Guid productId)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var customerId))
                return Unauthorized(new { message = "Invalid token user id" });

            var removed = await _service.Remove(customerId, productId);

            if (!removed)
                return NotFound(new { message = "Favorite not found" });

            return Ok(new { message = "Removed from favorites" });
        }
    }
}
