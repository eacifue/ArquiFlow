using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ArquiFlow.Api.Features.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    JwtTokenService tokenService,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized();
        }

        user.LastLoginAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var token = tokenService.GenerateToken(user, roles);
        var studioName = configuration["Studio:Name"] ?? string.Empty;

        return Ok(new LoginResponse(token, user.Id, user.Email!, user.FullName, roles, studioName));
    }
}
