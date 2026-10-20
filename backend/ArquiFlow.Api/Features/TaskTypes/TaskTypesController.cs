using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.TaskTypes;

// Master list of task names (e.g. "Fundaciones", "Mampostería") that feeds the
// task picker in the schedule. Read by anyone who can build a schedule;
// managed only by Admin, since it's a shared vocabulary across every project.
[ApiController]
[Route("api/task-types")]
[Authorize]
public class TaskTypesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    public async Task<ActionResult<List<TaskTypeDto>>> GetAll(CancellationToken ct)
    {
        var taskTypes = await db.TaskTypes
            .OrderBy(t => t.Name)
            .Select(t => new TaskTypeDto(t.Id, t.Name,
                db.ScheduleTasks.Where(s => s.Name == t.Name).Select(s => s.ProjectId).Distinct().Count()))
            .ToListAsync(ct);

        return Ok(taskTypes);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<TaskTypeDto>> Create(CreateTaskTypeRequest request, CancellationToken ct)
    {
        var nameTaken = await db.TaskTypes.AnyAsync(t => t.Name == request.Name, ct);
        if (nameTaken)
        {
            return Conflict("Ya existe una tarea con ese nombre.");
        }

        var taskType = new TaskType { Id = Guid.NewGuid(), Name = request.Name };

        db.TaskTypes.Add(taskType);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetAll), new TaskTypeDto(taskType.Id, taskType.Name, 0));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<TaskTypeDto>> Update(Guid id, UpdateTaskTypeRequest request, CancellationToken ct)
    {
        var taskType = await db.TaskTypes.FindAsync([id], ct);
        if (taskType is null)
        {
            return NotFound();
        }

        var nameTaken = await db.TaskTypes.AnyAsync(t => t.Id != id && t.Name == request.Name, ct);
        if (nameTaken)
        {
            return Conflict("Ya existe una tarea con ese nombre.");
        }

        // Schedule tasks store the name, so renaming the type renames it in every project.
        var oldName = taskType.Name;
        await db.ScheduleTasks
            .Where(s => s.Name == oldName)
            .ExecuteUpdateAsync(u => u.SetProperty(s => s.Name, request.Name), ct);

        taskType.Name = request.Name;
        await db.SaveChangesAsync(ct);

        var projectCount = await db.ScheduleTasks
            .Where(s => s.Name == taskType.Name)
            .Select(s => s.ProjectId)
            .Distinct()
            .CountAsync(ct);

        return Ok(new TaskTypeDto(taskType.Id, taskType.Name, projectCount));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var taskType = await db.TaskTypes.FindAsync([id], ct);
        if (taskType is null)
        {
            return NotFound();
        }

        var inUse = await db.ScheduleTasks.AnyAsync(s => s.Name == taskType.Name, ct);
        if (inUse)
        {
            return Conflict("Un tipo en uso no se puede eliminar.");
        }

        db.TaskTypes.Remove(taskType);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
