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
        var projects = await db.Projects
            .OrderBy(p => p.Name)
            .Select(p => new ProjectDto(p.Id, p.Name, p.Address, p.Description, p.StartDate, p.EndDate, p.Status, p.TotalBudget))
            .ToListAsync(ct);

        return Ok(projects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id, CancellationToken ct)
    {
        var project = await db.Projects
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
}
