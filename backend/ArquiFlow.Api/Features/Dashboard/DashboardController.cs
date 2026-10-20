using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.Dashboard;

public record PendingPaymentsSummary(decimal Total, int PaymentCount, int SupplierCount);

public record SupplierBalanceDto(Guid Id, string Name, string? Category, int ProjectCount, decimal Paid, decimal Pending);

public record RecentLogEntryDto(
    Guid ProjectId,
    string ProjectName,
    string? Notes,
    DateTime CreatedAt,
    string AuthorName,
    int PhotoCount,
    string? FirstPhotoUrl);

public record TodayLogsSummary(int Logged, int ActiveProjects, IReadOnlyList<string> Missing);

public record DashboardDto(
    PendingPaymentsSummary PendingPayments,
    IReadOnlyList<SupplierBalanceDto> TopSupplierBalances,
    IReadOnlyList<RecentLogEntryDto> RecentLogEntries,
    TodayLogsSummary TodayLogs);

// Cross-project summary for the Inicio screen. Project cards and their health
// come from GET /api/projects; this adds the money and activity rollups.
[ApiController]
[Route("api/dashboard")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    private const int TopSuppliers = 4;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get(CancellationToken ct)
    {
        var pending = await db.Payments
            .Where(p => p.Status == PaymentStatus.Pending)
            .Select(p => new { p.Amount, p.SupplierId })
            .ToListAsync(ct);

        var balances = await db.Suppliers
            .Select(s => new SupplierBalanceDto(
                s.Id, s.Name, s.Category,
                db.Projects.Count(pr => pr.Payments.Any(p => p.SupplierId == s.Id)),
                s.Payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => (decimal?)p.Amount) ?? 0,
                s.Payments.Where(p => p.Status == PaymentStatus.Pending).Sum(p => (decimal?)p.Amount) ?? 0))
            .Where(s => s.Pending > 0)
            .OrderByDescending(s => s.Pending)
            .Take(TopSuppliers)
            .ToListAsync(ct);

        var since = DateTime.UtcNow.Date.AddDays(-1);
        var recent = await db.SiteLogEntries
            .Where(e => e.CreatedAt >= since)
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new RecentLogEntryDto(
                e.ProjectId, e.Project.Name, e.Notes, e.CreatedAt, e.Author.FullName,
                e.Photos.Count, e.Photos.Select(p => p.FileUrl).FirstOrDefault()))
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var active = await db.Projects
            .Where(p => p.Status == ProjectStatus.InProgress)
            .OrderBy(p => p.Name)
            .Select(p => new { p.Name, LoggedToday = p.SiteLogEntries.Any(e => e.Date == today) })
            .ToListAsync(ct);

        return Ok(new DashboardDto(
            new PendingPaymentsSummary(
                pending.Sum(p => p.Amount),
                pending.Count,
                pending.Where(p => p.SupplierId != null).Select(p => p.SupplierId).Distinct().Count()),
            balances,
            recent,
            new TodayLogsSummary(
                active.Count(p => p.LoggedToday),
                active.Count,
                active.Where(p => !p.LoggedToday).Select(p => p.Name).ToList())));
    }
}
