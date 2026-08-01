using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Budget;

[ApiController]
[Route("api/budget-items/{budgetItemId:guid}/expenses")]
[Authorize]
public class ExpensesController(AppDbContext db, IFileStorageService fileStorage) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ExpenseDto>>> GetAll(Guid budgetItemId, CancellationToken ct)
    {
        if (!await HasAccessAsync(budgetItemId, ct))
        {
            return NotFound();
        }

        var expenses = await db.Expenses
            .Where(e => e.BudgetItemId == budgetItemId)
            .OrderByDescending(e => e.Date)
            .Select(e => new ExpenseDto(e.Id, e.BudgetItemId, e.Amount, e.Date, e.Description, e.ReceiptFileUrl))
            .ToListAsync(ct);

        return Ok(expenses);
    }

    // Supervisors can log expenses from the site (per the plan's role scope);
    // only Admin/PM can delete them, to avoid accidental data loss on-site.
    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<ExpenseDto>> Create(Guid budgetItemId, [FromForm] CreateExpenseRequest request, CancellationToken ct)
    {
        var budgetItemExists = await db.BudgetItems.AnyAsync(b => b.Id == budgetItemId, ct);
        if (!budgetItemExists)
        {
            return NotFound();
        }

        string? receiptUrl = null;
        if (request.Receipt is not null)
        {
            await using var stream = request.Receipt.OpenReadStream();
            receiptUrl = await fileStorage.SaveFileAsync(stream, request.Receipt.FileName, ct);
        }

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            BudgetItemId = budgetItemId,
            Amount = request.Amount,
            Date = request.Date,
            Description = request.Description,
            ReceiptFileUrl = receiptUrl
        };

        db.Expenses.Add(expense);
        await db.SaveChangesAsync(ct);

        var dto = new ExpenseDto(expense.Id, expense.BudgetItemId, expense.Amount, expense.Date, expense.Description, expense.ReceiptFileUrl);

        return CreatedAtAction(nameof(GetAll), new { budgetItemId }, dto);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<IActionResult> Delete(Guid budgetItemId, Guid id, CancellationToken ct)
    {
        var expense = await db.Expenses.FirstOrDefaultAsync(e => e.BudgetItemId == budgetItemId && e.Id == id, ct);
        if (expense is null)
        {
            return NotFound();
        }

        db.Expenses.Remove(expense);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private async Task<bool> HasAccessAsync(Guid budgetItemId, CancellationToken ct)
    {
        if (!User.IsInRole(AppRoles.Client))
        {
            return true;
        }

        var userId = User.GetUserId();
        return await db.BudgetItems
            .Where(b => b.Id == budgetItemId)
            .AnyAsync(b => b.Project.ClientAccesses.Any(a => a.ClientUserId == userId), ct);
    }
}
