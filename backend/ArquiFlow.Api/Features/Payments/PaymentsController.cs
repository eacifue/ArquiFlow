using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Payments;

// Payments are internal financial data — unlike Budget/Schedule/SiteLog, Client
// gets no access at all here (not even scoped read), and Supervisor is excluded
// too since the plan only puts bitácora + expenses in their hands.
[ApiController]
[Route("api/projects/{projectId:guid}/payments")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
public class PaymentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PaymentDto>>> GetAll(Guid projectId, CancellationToken ct)
    {
        var payments = await db.Payments
            .Where(p => p.ProjectId == projectId)
            .OrderByDescending(p => p.Date)
            .Select(p => new PaymentDto(p.Id, p.ProjectId, p.SupplierId, p.Supplier.Name, p.ExpenseId, p.Amount, p.Date, p.Method, p.Status))
            .ToListAsync(ct);

        return Ok(payments);
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> Create(Guid projectId, CreatePaymentRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        var supplier = await db.Suppliers.FindAsync([request.SupplierId], ct);
        if (supplier is null)
        {
            return BadRequest("Proveedor inválido.");
        }

        if (request.ExpenseId is not null)
        {
            var expenseBelongsToProject = await db.Expenses
                .AnyAsync(e => e.Id == request.ExpenseId && e.BudgetItem.ProjectId == projectId, ct);
            if (!expenseBelongsToProject)
            {
                return BadRequest("El gasto seleccionado no pertenece a esta obra.");
            }
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            SupplierId = request.SupplierId,
            ExpenseId = request.ExpenseId,
            Amount = request.Amount,
            Date = request.Date,
            Method = request.Method,
            Status = PaymentStatus.Pending
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync(ct);

        var dto = new PaymentDto(payment.Id, payment.ProjectId, payment.SupplierId, supplier.Name, payment.ExpenseId, payment.Amount, payment.Date, payment.Method, payment.Status);
        return CreatedAtAction(nameof(GetAll), new { projectId }, dto);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<PaymentDto>> UpdateStatus(Guid projectId, Guid id, UpdatePaymentStatusRequest request, CancellationToken ct)
    {
        var payment = await db.Payments
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == id, ct);

        if (payment is null)
        {
            return NotFound();
        }

        payment.Status = request.Status;
        await db.SaveChangesAsync(ct);

        var dto = new PaymentDto(payment.Id, payment.ProjectId, payment.SupplierId, payment.Supplier.Name, payment.ExpenseId, payment.Amount, payment.Date, payment.Method, payment.Status);
        return Ok(dto);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id, CancellationToken ct)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == id, ct);
        if (payment is null)
        {
            return NotFound();
        }

        db.Payments.Remove(payment);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
