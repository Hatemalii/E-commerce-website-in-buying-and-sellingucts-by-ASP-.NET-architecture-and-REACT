using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VendorHub.API.DTOs;
using VendorHub.API.Services.Interface;

namespace VendorHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewsService _service;

        public ReviewsController(IReviewsService service)
        {
            _service = service;
        }

        [HttpGet("product/{id:guid}")]
        public async Task<IActionResult> GetProductReviews(Guid id)
        {
            var reviews = await _service.GetProductReviews(id);
            return Ok(reviews);
        }

        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            var userIdValue = User.FindFirst("UserId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(userIdValue, out var customerId))
                return Unauthorized(new { message = "Invalid token user id" });

            try
            {
                var review = await _service.Create(customerId, dto);
                return Ok(review);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
