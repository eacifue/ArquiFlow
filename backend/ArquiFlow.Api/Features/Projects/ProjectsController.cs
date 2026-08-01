using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Projects;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetAll(CancellationToken ct)
    {
        var query = ScopeToCaller(db.Projects.AsQueryable());

        var projects = await query
            .OrderBy(p => p.Name)
            .Select(p => new ProjectDto(p.Id, p.Name, p.Address, p.Description, p.StartDate, p.EndDate, p.Status, p.TotalBudget))
            .ToListAsync(ct);

        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id, CancellationToken ct)
    {
        var query = ScopeToCaller(db.Projects.AsQueryable());

        var project = await query
            .Where(p => p.Id == id)
            .Select(p => new ProjectDto(p.Id, p.Name, p.Address, p.Description, p.StartDate, p.EndDate, p.Status, p.TotalBudget))
            .FirstOrDefaultAsync(ct);

        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectRequest request, CancellationToken ct)
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            Description = request.Description,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalBudget = request.TotalBudget,
            Status = ProjectStatus.Planning
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(ct);

        var dto = new ProjectDto(project.Id, project.Name, project.Address, project.Description,
            project.StartDate, project.EndDate, project.Status, project.TotalBudget);

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<ProjectDto>> Update(Guid id, UpdateProjectRequest request, CancellationToken ct)
    {
        var project = await db.Projects.FindAsync([id], ct);
        if (project is null)
        {
            return NotFound();
        }

        project.Name = request.Name;
        project.Address = request.Address;
        project.Description = request.Description;
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;
        project.TotalBudget = request.TotalBudget;
        project.Status = request.Status;

        await db.SaveChangesAsync(ct);

        var dto = new ProjectDto(project.Id, project.Name, project.Address, project.Description,
            project.StartDate, project.EndDate, project.Status, project.TotalBudget);

        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var project = await db.Projects.FindAsync([id], ct);
        if (project is null)
        {
            return NotFound();
        }

        db.Projects.Remove(project);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    // Client-role users only see the projects they've been explicitly granted access to.
    // Internal roles (Admin/ProjectManager/Supervisor) see everything (single-tenant app).
    private IQueryable<Project> ScopeToCaller(IQueryable<Project> query)
    {
        if (!User.IsInRole(AppRoles.Client))
        {
            return query;
        }

        var userId = User.GetUserId();
        return query.Where(p => p.ClientAccesses.Any(a => a.ClientUserId == userId));
    }
}
