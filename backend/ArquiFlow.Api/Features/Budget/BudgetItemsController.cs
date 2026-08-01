using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Budget;

[ApiController]
[Route("api/projects/{projectId:guid}/budget-items")]
[Authorize]
public class BudgetItemsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BudgetItemDto>>> GetAll(Guid projectId, CancellationToken ct)
    {
        if (!await HasProjectAccessAsync(projectId, ct))
        {
            return NotFound();
        }

        var items = await db.BudgetItems
            .Where(b => b.ProjectId == projectId)
            .OrderBy(b => b.Category).ThenBy(b => b.Description)
            .Select(b => new BudgetItemDto(
                b.Id, b.ProjectId, b.Category, b.Description, b.BudgetedAmount, b.Unit, b.Quantity,
                b.Expenses.Sum(e => (decimal?)e.Amount) ?? 0))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BudgetItemDto>> GetById(Guid projectId, Guid id, CancellationToken ct)
    {
        if (!await HasProjectAccessAsync(projectId, ct))
        {
            return NotFound();
        }

        var item = await db.BudgetItems
            .Where(b => b.ProjectId == projectId && b.Id == id)
            .Select(b => new BudgetItemDto(
                b.Id, b.ProjectId, b.Category, b.Description, b.BudgetedAmount, b.Unit, b.Quantity,
                b.Expenses.Sum(e => (decimal?)e.Amount) ?? 0))
            .FirstOrDefaultAsync(ct);

        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<BudgetItemDto>> Create(Guid projectId, CreateBudgetItemRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        var item = new BudgetItem
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Category = request.Category,
            Description = request.Description,
            BudgetedAmount = request.BudgetedAmount,
            Unit = request.Unit,
            Quantity = request.Quantity
        };

        db.BudgetItems.Add(item);
        await db.SaveChangesAsync(ct);

        var dto = new BudgetItemDto(item.Id, item.ProjectId, item.Category, item.Description,
            item.BudgetedAmount, item.Unit, item.Quantity, 0);

        return CreatedAtAction(nameof(GetById), new { projectId, id = item.Id }, dto);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<BudgetItemDto>> Update(Guid projectId, Guid id, UpdateBudgetItemRequest request, CancellationToken ct)
    {
        var item = await db.BudgetItems
            .Include(b => b.Expenses)
            .FirstOrDefaultAsync(b => b.ProjectId == projectId && b.Id == id, ct);

        if (item is null)
        {
            return NotFound();
        }

        item.Category = request.Category;
        item.Description = request.Description;
        item.BudgetedAmount = request.BudgetedAmount;
        item.Unit = request.Unit;
        item.Quantity = request.Quantity;

        await db.SaveChangesAsync(ct);

        var dto = new BudgetItemDto(item.Id, item.ProjectId, item.Category, item.Description,
            item.BudgetedAmount, item.Unit, item.Quantity, item.Expenses.Sum(e => e.Amount));

        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id, CancellationToken ct)
    {
        var item = await db.BudgetItems.FirstOrDefaultAsync(b => b.ProjectId == projectId && b.Id == id, ct);
        if (item is null)
        {
            return NotFound();
        }

        db.BudgetItems.Remove(item);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    // Same rule as ProjectsController: Client role is scoped to projects it was granted access to.
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
