using System.Text.RegularExpressions;
using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;

namespace ArquiFlow.Api.Features.Reports;

[ApiController]
[Route("api/projects/{projectId:guid}/report")]
[Authorize]
public class ProjectReportController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private const int RecentPhotoCount = 6;

    [HttpGet]
    public async Task<IActionResult> Get(Guid projectId, CancellationToken ct)
    {
        if (!await HasProjectAccessAsync(projectId, ct))
        {
            return NotFound();
        }

        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
        if (project is null)
        {
            return NotFound();
        }

        var budgetItems = await db.BudgetItems
            .Where(b => b.ProjectId == projectId)
            .OrderBy(b => b.Category).ThenBy(b => b.Description)
            .Select(b => new BudgetItemSummary(b.Category, b.Description, b.BudgetedAmount, b.Expenses.Sum(e => (decimal?)e.Amount) ?? 0))
            .ToListAsync(ct);

        var scheduleTasks = await db.ScheduleTasks
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.SortOrder).ThenBy(t => t.StartDate)
            .Select(t => new ScheduleTaskSummary(t.Name, t.StartDate, t.EndDate, t.ProgressPercent, t.Status.ToString()))
            .ToListAsync(ct);

        var recentPhotos = await db.SiteLogPhotos
            .Where(p => p.SiteLogEntry.ProjectId == projectId)
            .OrderByDescending(p => p.SiteLogEntry.Date)
            .Take(RecentPhotoCount)
            .Select(p => new { p.FileUrl, p.Caption, Date = p.SiteLogEntry.Date })
            .ToListAsync(ct);

        var uploadsPath = Path.Combine(env.ContentRootPath, "uploads");
        var photoSummaries = recentPhotos
            .Select(p => new SiteLogPhotoSummary(p.Date, Path.Combine(uploadsPath, Path.GetFileName(p.FileUrl)), p.Caption))
            .Where(p => System.IO.File.Exists(p.PhysicalFilePath))
            .ToList();

        var data = new ProjectReportData(
            project.Name,
            project.Address,
            project.Status.ToString(),
            project.StartDate,
            project.EndDate,
            project.TotalBudget,
            budgetItems,
            scheduleTasks,
            photoSummaries);

        var pdfBytes = new ProjectReportDocument(data).GeneratePdf();
        var fileName = $"reporte-{SanitizeFileName(project.Name)}.pdf";

        return File(pdfBytes, "application/pdf", fileName);
    }

    private static string SanitizeFileName(string name)
    {
        var normalized = Regex.Replace(name, @"[^a-zA-Z0-9\-]+", "-").Trim('-').ToLowerInvariant();
        return string.IsNullOrEmpty(normalized) ? "obra" : normalized;
    }

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
