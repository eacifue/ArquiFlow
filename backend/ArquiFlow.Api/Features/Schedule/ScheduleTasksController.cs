using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Schedule;

[ApiController]
[Route("api/projects/{projectId:guid}/schedule-tasks")]
[Authorize]
public class ScheduleTasksController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ScheduleTaskDto>>> GetAll(Guid projectId, CancellationToken ct)
    {
        if (!await HasProjectAccessAsync(projectId, ct))
        {
            return NotFound();
        }

        var tasks = await db.ScheduleTasks
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.SortOrder).ThenBy(t => t.StartDate)
            .Select(t => new ScheduleTaskDto(t.Id, t.ProjectId, t.Name, t.StartDate, t.EndDate, t.ProgressPercent, t.Status, t.SortOrder))
            .ToListAsync(ct);

        return Ok(tasks);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<ScheduleTaskDto>> Create(Guid projectId, CreateScheduleTaskRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        var task = new ScheduleTask
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = request.Name,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            ProgressPercent = 0,
            Status = ScheduleTaskStatus.NotStarted,
            SortOrder = request.SortOrder
        };

        db.ScheduleTasks.Add(task);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetAll), new { projectId }, ToDto(task));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<ScheduleTaskDto>> Update(Guid projectId, Guid id, UpdateScheduleTaskRequest request, CancellationToken ct)
    {
        var task = await db.ScheduleTasks.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Id == id, ct);
        if (task is null)
        {
            return NotFound();
        }

        task.Name = request.Name;
        task.StartDate = request.StartDate;
        task.EndDate = request.EndDate;
        task.ProgressPercent = request.ProgressPercent;
        task.Status = ComputeStatus(request.ProgressPercent, request.EndDate);
        task.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(ct);

        return Ok(ToDto(task));
    }

    // Used by the Gantt view when the user drags a bar's dates or its progress handle.
    [HttpPatch("{id:guid}/schedule")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<ScheduleTaskDto>> UpdateSchedule(Guid projectId, Guid id, UpdateScheduleTaskScheduleRequest request, CancellationToken ct)
    {
        var task = await db.ScheduleTasks.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Id == id, ct);
        if (task is null)
        {
            return NotFound();
        }

        task.StartDate = request.StartDate;
        task.EndDate = request.EndDate;
        task.ProgressPercent = request.ProgressPercent;
        task.Status = ComputeStatus(request.ProgressPercent, request.EndDate);

        await db.SaveChangesAsync(ct);

        return Ok(ToDto(task));
    }

    // Status is always derived, never set directly by the client: a task is Delayed
    // when it isn't finished and its end date has passed, so nobody has to remember
    // to flip a flag every day.
    private static ScheduleTaskStatus ComputeStatus(int progressPercent, DateOnly endDate) => progressPercent switch
    {
        >= 100 => ScheduleTaskStatus.Done,
        <= 0 => ScheduleTaskStatus.NotStarted,
        _ when endDate < DateOnly.FromDateTime(DateTime.UtcNow) => ScheduleTaskStatus.Delayed,
        _ => ScheduleTaskStatus.InProgress
    };

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id, CancellationToken ct)
    {
        var task = await db.ScheduleTasks.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Id == id, ct);
        if (task is null)
        {
            return NotFound();
        }

        db.ScheduleTasks.Remove(task);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static ScheduleTaskDto ToDto(ScheduleTask t) =>
        new(t.Id, t.ProjectId, t.Name, t.StartDate, t.EndDate, t.ProgressPercent, t.Status, t.SortOrder);

    private async Task<bool> HasProjectAccessAsync(Guid projectId, CancellationToken ct)
    {
        if (!User.IsInRole(AppRoles.Client))
        {
            return true;
        }

        var userId = User.GetUserId();
        return await db.ProjectClientAccesses.AnyAsync(a => a.ProjectId == projectId && a.ClientUserId == userId, ct);
    }
}
