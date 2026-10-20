using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Users;

[ApiController]
[Route("api/users")]
[Authorize(Roles = AppRoles.Admin)]
public class UsersController(UserManager<ApplicationUser> userManager, AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAll(CancellationToken ct)
    {
        var users = await userManager.Users.OrderBy(u => u.FullName).ToListAsync(ct);

        var projects = await db.Projects
            .Select(p => new
            {
                p.Name,
                p.ProjectManagerId,
                p.SupervisorId,
                Clients = p.ClientAccesses.Select(a => a.ClientUserId).ToList()
            })
            .OrderBy(p => p.Name)
            .ToListAsync(ct);

        var result = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            var isAdmin = roles.Contains(AppRoles.Admin);
            var names = isAdmin
                ? []
                : projects
                    .Where(p => p.ProjectManagerId == user.Id || p.SupervisorId == user.Id || p.Clients.Contains(user.Id))
                    .Select(p => p.Name)
                    .ToList();

            result.Add(new UserDto(user.Id, user.Email!, user.FullName, roles, isAdmin, names, user.LastLoginAt));
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return Conflict("Ya existe un usuario con ese email.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FullName = request.FullName
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(e => e.Description));
        }

        await userManager.AddToRoleAsync(user, request.Role);

        return CreatedAtAction(nameof(GetAll), new UserDto(user.Id, user.Email!, user.FullName, [request.Role],
            request.Role == AppRoles.Admin, [], null));
    }

    // Changing the role changes what the user sees in every project they're on.
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserRequest request)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        var emailOwner = await userManager.FindByEmailAsync(request.Email);
        if (emailOwner is not null && emailOwner.Id != id)
        {
            return Conflict("Ya existe un usuario con ese email.");
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.UserName = request.Email;

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(e => e.Description));
        }

        var roles = await userManager.GetRolesAsync(user);
        if (!(roles.Count == 1 && roles[0] == request.Role))
        {
            await userManager.RemoveFromRolesAsync(user, roles);
            await userManager.AddToRoleAsync(user, request.Role);
        }

        return NoContent();
    }

    // Admin sets a new password and hands it to the user; there's no email-based reset.
    [HttpPost("{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors.Select(e => e.Description));
        }

        return NoContent();
    }
}
