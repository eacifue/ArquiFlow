using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Budget;

public record ExpenseWithBudgetItemDto(
    Guid Id,
    Guid BudgetItemId,
    string BudgetItemDescription,
    decimal Amount,
    DateOnly Date,
    string? Description);

// Flat, project-wide view of expenses across all budget items — used by the
// Payments tab to let a payment optionally reference the expense it settles.
[ApiController]
[Route("api/projects/{projectId:guid}/expenses")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
public class ProjectExpensesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ExpenseWithBudgetItemDto>>> GetAll(Guid projectId, CancellationToken ct)
    {
        var expenses = await db.Expenses
            .Where(e => e.BudgetItem.ProjectId == projectId)
            .OrderByDescending(e => e.Date)
            .Select(e => new ExpenseWithBudgetItemDto(e.Id, e.BudgetItemId, e.BudgetItem.Description, e.Amount, e.Date, e.Description))
            .ToListAsync(ct);

        return Ok(expenses);
    }
}
