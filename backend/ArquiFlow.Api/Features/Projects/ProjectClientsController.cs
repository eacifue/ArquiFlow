using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Projects;

[ApiController]
[Route("api/projects/{projectId:guid}/clients")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
public class ProjectClientsController(AppDbContext db, UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProjectClientDto>>> GetAll(Guid projectId, CancellationToken ct)
    {
        var clients = await db.ProjectClientAccesses
            .Where(a => a.ProjectId == projectId)
            .Select(a => new ProjectClientDto(a.ClientUser.Id, a.ClientUser.Email!, a.ClientUser.FullName))
            .ToListAsync(ct);

        return Ok(clients);
    }

    // Creates the Client user if the email is new, or links an existing Client user to
    // this project if they already have access to another one. Password is only used
    // when a new account is created; it's ignored when linking an existing client.
    [HttpPost]
    public async Task<ActionResult<ProjectClientDto>> Invite(Guid projectId, InviteProjectClientRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            user = new ApplicationUser
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

            await userManager.AddToRoleAsync(user, AppRoles.Client);
        }
        else if (!await userManager.IsInRoleAsync(user, AppRoles.Client))
        {
            return BadRequest("Ese email ya pertenece a un usuario interno.");
        }

        var alreadyLinked = await db.ProjectClientAccesses
            .AnyAsync(a => a.ProjectId == projectId && a.ClientUserId == user.Id, ct);

        if (!alreadyLinked)
        {
            db.ProjectClientAccesses.Add(new ProjectClientAccess
            {
                Id = Guid.NewGuid(),
                ProjectId = projectId,
                ClientUserId = user.Id
            });
            await db.SaveChangesAsync(ct);
        }

        return Ok(new ProjectClientDto(user.Id, user.Email!, user.FullName));
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Revoke(Guid projectId, Guid userId, CancellationToken ct)
    {
        var access = await db.ProjectClientAccesses
            .FirstOrDefaultAsync(a => a.ProjectId == projectId && a.ClientUserId == userId, ct);

        if (access is null)
        {
            return NotFound();
        }

        db.ProjectClientAccesses.Remove(access);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
