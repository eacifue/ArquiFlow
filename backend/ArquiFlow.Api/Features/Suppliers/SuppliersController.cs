using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Suppliers;

// Suppliers are shared across all projects (not project-scoped), so this is a
// top-level resource. Client role has no access at all — matches Payments.
[ApiController]
[Route("api/suppliers")]
[Authorize]
public class SuppliersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    public async Task<ActionResult<List<SupplierDto>>> GetAll(CancellationToken ct)
    {
        var suppliers = await db.Suppliers
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.ContactName, s.Phone, s.Email, s.TaxId, s.Category))
            .ToListAsync(ct);

        return Ok(suppliers);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<SupplierDto>> Create(CreateSupplierRequest request, CancellationToken ct)
    {
        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ContactName = request.ContactName,
            Phone = request.Phone,
            Email = request.Email,
            TaxId = request.TaxId,
            Category = request.Category
        };

        db.Suppliers.Add(supplier);
        await db.SaveChangesAsync(ct);

        var dto = new SupplierDto(supplier.Id, supplier.Name, supplier.ContactName, supplier.Phone, supplier.Email, supplier.TaxId, supplier.Category);
        return CreatedAtAction(nameof(GetAll), dto);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<ActionResult<SupplierDto>> Update(Guid id, UpdateSupplierRequest request, CancellationToken ct)
    {
        var supplier = await db.Suppliers.FindAsync([id], ct);
        if (supplier is null)
        {
            return NotFound();
        }

        supplier.Name = request.Name;
        supplier.ContactName = request.ContactName;
        supplier.Phone = request.Phone;
        supplier.Email = request.Email;
        supplier.TaxId = request.TaxId;
        supplier.Category = request.Category;

        await db.SaveChangesAsync(ct);

        return Ok(new SupplierDto(supplier.Id, supplier.Name, supplier.ContactName, supplier.Phone, supplier.Email, supplier.TaxId, supplier.Category));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var supplier = await db.Suppliers.FindAsync([id], ct);
        if (supplier is null)
        {
            return NotFound();
        }

        var hasPayments = await db.Payments.AnyAsync(p => p.SupplierId == id, ct);
        if (hasPayments)
        {
            return Conflict("No se puede eliminar: el proveedor tiene pagos registrados.");
        }

        db.Suppliers.Remove(supplier);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
