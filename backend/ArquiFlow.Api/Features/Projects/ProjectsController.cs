using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Projects;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController(
    AppDbContext db,
    ProjectMetricsService metricsService,
    UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetAll(CancellationToken ct)
    {
        var projects = await ScopeToCaller(db.Projects.AsQueryable())
            .OrderBy(p => p.Name)
            .Select(p => new ProjectRow(
                p.Id, p.Name, p.Address, p.Description, p.StartDate, p.EndDate, p.Status, p.TotalBudget,
                p.ProjectManager == null ? null : new PersonRef(p.ProjectManager.Id, p.ProjectManager.FullName),
                p.Supervisor == null ? null : new PersonRef(p.Supervisor.Id, p.Supervisor.FullName)))
            .ToListAsync(ct);

        var metrics = await metricsService.ComputeAsync(projects.Select(p => p.Id).ToList(), ct);

        return Ok(projects.Select(p => p.ToDto(metrics[p.Id])).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id, CancellationToken ct)
    {
        var project = await LoadRowAsync(ScopeToCaller(db.Projects.AsQueryable()), id, ct);
        if (project is null)
        {
            return NotFound();
        }

        var metrics = await metricsService.ComputeAsync(id, ct);
        return Ok(project.ToDto(metrics));
    }

    // People who can be assigned as a project's PM or supervisor in the project form.
    [HttpGet("staff")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<List<StaffMemberDto>>> GetStaff(CancellationToken ct)
    {
        var staff = new List<StaffMemberDto>();
        foreach (var role in new[] { AppRoles.Admin, AppRoles.ProjectManager, AppRoles.Supervisor })
        {
            var users = await userManager.GetUsersInRoleAsync(role);
            staff.AddRange(users.Select(u => new StaffMemberDto(u.Id, u.FullName, role)));
        }

        return Ok(staff.OrderBy(s => s.FullName).ToList());
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
            ProjectManagerId = request.ProjectManagerId,
            SupervisorId = request.SupervisorId,
            Status = ProjectStatus.Planning
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync(ct);

        var row = await LoadRowAsync(db.Projects, project.Id, ct);
        var metrics = await metricsService.ComputeAsync(project.Id, ct);

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, row!.ToDto(metrics));
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
        project.ProjectManagerId = request.ProjectManagerId;
        project.SupervisorId = request.SupervisorId;

        await db.SaveChangesAsync(ct);

        var row = await LoadRowAsync(db.Projects, id, ct);
        var metrics = await metricsService.ComputeAsync(id, ct);

        return Ok(row!.ToDto(metrics));
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

    private static Task<ProjectRow?> LoadRowAsync(IQueryable<Project> query, Guid id, CancellationToken ct) =>
        query
            .Where(p => p.Id == id)
            .Select(p => new ProjectRow(
                p.Id, p.Name, p.Address, p.Description, p.StartDate, p.EndDate, p.Status, p.TotalBudget,
                p.ProjectManager == null ? null : new PersonRef(p.ProjectManager.Id, p.ProjectManager.FullName),
                p.Supervisor == null ? null : new PersonRef(p.Supervisor.Id, p.Supervisor.FullName)))
            .FirstOrDefaultAsync(ct);

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

    private record ProjectRow(
        Guid Id,
        string Name,
        string? Address,
        string? Description,
        DateOnly? StartDate,
        DateOnly? EndDate,
        ProjectStatus Status,
        decimal TotalBudget,
        PersonRef? ProjectManager,
        PersonRef? Supervisor)
    {
        public ProjectDto ToDto(ProjectMetrics metrics) =>
            new(Id, Name, Address, Description, StartDate, EndDate, Status, TotalBudget, ProjectManager, Supervisor, metrics);
    }
}
