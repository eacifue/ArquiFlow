using ArquiFlow.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Common;

public enum HealthLevel
{
    Ok,
    Riesgo,
    Critico
}

public record CategoryMetrics(string Category, decimal Budgeted, decimal Spent);

public record ProjectMetrics(
    int Progress,
    int PlannedProgress,
    int TaskCount,
    int TasksDone,
    int TasksInProgress,
    int TasksNotStarted,
    int DelayedTasks,
    HealthLevel ScheduleHealth,
    decimal Budgeted,
    decimal Spent,
    int BudgetItemCount,
    IReadOnlyList<CategoryMetrics> Categories,
    HealthLevel BudgetHealth,
    string? BudgetHealthCategory,
    int? BudgetHealthCategoryPercent,
    DateTime? LastSiteLogAt,
    string? LastSiteLogAuthor);

// Single place where a project's "semáforo" is derived, so the dashboard, the
// project list, the project header and the PDF all agree on what "en riesgo" means.
public class ProjectMetricsService(AppDbContext db)
{
    // Percentage points of progress behind plan that tip a schedule into each level.
    private const int ScheduleRiskPoints = 5;
    private const int ScheduleCriticalPoints = 15;
    // A budget category consuming this share of its allocation is flagged as at risk.
    private const decimal BudgetRiskRatio = 0.9m;

    public async Task<ProjectMetrics> ComputeAsync(Guid projectId, CancellationToken ct) =>
        (await ComputeAsync([projectId], ct))[projectId];

    public async Task<Dictionary<Guid, ProjectMetrics>> ComputeAsync(IReadOnlyCollection<Guid> projectIds, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var projects = await db.Projects
            .Where(p => projectIds.Contains(p.Id))
            .Select(p => new { p.Id, p.TotalBudget })
            .ToListAsync(ct);

        var tasks = await db.ScheduleTasks
            .Where(t => projectIds.Contains(t.ProjectId))
            .Select(t => new { t.ProjectId, t.StartDate, t.EndDate, t.ProgressPercent })
            .ToListAsync(ct);

        var items = await db.BudgetItems
            .Where(b => projectIds.Contains(b.ProjectId))
            .Select(b => new
            {
                b.ProjectId,
                b.Category,
                b.BudgetedAmount,
                Spent = b.Expenses.Sum(e => (decimal?)e.Amount) ?? 0
            })
            .ToListAsync(ct);

        var lastLogs = await db.SiteLogEntries
            .Where(e => projectIds.Contains(e.ProjectId))
            .Where(e => e.CreatedAt == db.SiteLogEntries
                .Where(x => x.ProjectId == e.ProjectId)
                .Max(x => x.CreatedAt))
            .Select(e => new { e.ProjectId, e.CreatedAt, Author = e.Author.FullName })
            .ToListAsync(ct);

        var result = new Dictionary<Guid, ProjectMetrics>();
        foreach (var project in projects)
        {
            var projectTasks = tasks.Where(t => t.ProjectId == project.Id).ToList();

            double totalDays = 0, doneDays = 0, plannedDays = 0;
            foreach (var t in projectTasks)
            {
                var days = t.EndDate.DayNumber - t.StartDate.DayNumber + 1;
                var elapsed = Math.Clamp(today.DayNumber - t.StartDate.DayNumber + 1, 0, days);
                totalDays += days;
                doneDays += days * t.ProgressPercent / 100.0;
                plannedDays += elapsed;
            }

            var progress = totalDays > 0 ? (int)Math.Round(doneDays / totalDays * 100) : 0;
            var planned = totalDays > 0 ? (int)Math.Round(plannedDays / totalDays * 100) : 0;
            var delayed = projectTasks.Count(t => t.ProgressPercent < 100 && t.EndDate < today);
            var behind = planned - progress;

            var scheduleHealth = behind > ScheduleCriticalPoints ? HealthLevel.Critico
                : behind > ScheduleRiskPoints || delayed > 0 ? HealthLevel.Riesgo
                : HealthLevel.Ok;

            var projectItems = items.Where(i => i.ProjectId == project.Id).ToList();
            var categories = projectItems
                .GroupBy(i => i.Category)
                .Select(g => new CategoryMetrics(g.Key, g.Sum(i => i.BudgetedAmount), g.Sum(i => i.Spent)))
                .OrderByDescending(c => c.Budgeted)
                .ToList();

            var itemsBudget = projectItems.Sum(i => i.BudgetedAmount);
            var budgeted = itemsBudget > 0 ? itemsBudget : project.TotalBudget;
            var spent = projectItems.Sum(i => i.Spent);

            var exceeded = categories
                .Where(c => c.Spent > c.Budgeted)
                .OrderByDescending(c => c.Spent - c.Budgeted)
                .FirstOrDefault();
            var atRisk = categories
                .Where(c => c.Budgeted > 0 && c.Spent / c.Budgeted >= BudgetRiskRatio)
                .OrderByDescending(c => c.Spent / c.Budgeted)
                .FirstOrDefault();

            HealthLevel budgetHealth;
            CategoryMetrics? flagged;
            if (exceeded is not null)
            {
                budgetHealth = HealthLevel.Critico;
                flagged = exceeded;
            }
            else if (atRisk is not null)
            {
                budgetHealth = HealthLevel.Riesgo;
                flagged = atRisk;
            }
            else
            {
                budgetHealth = HealthLevel.Ok;
                flagged = null;
            }

            var lastLog = lastLogs.FirstOrDefault(l => l.ProjectId == project.Id);

            result[project.Id] = new ProjectMetrics(
                progress,
                planned,
                projectTasks.Count,
                projectTasks.Count(t => t.ProgressPercent >= 100),
                projectTasks.Count(t => t.ProgressPercent is > 0 and < 100),
                projectTasks.Count(t => t.ProgressPercent <= 0),
                delayed,
                scheduleHealth,
                budgeted,
                spent,
                projectItems.Count,
                categories,
                budgetHealth,
                flagged?.Category,
                flagged is { Budgeted: > 0 } ? (int)Math.Round(flagged.Spent / flagged.Budgeted * 100) : null,
                lastLog?.CreatedAt,
                lastLog?.Author);
        }

        return result;
    }
}
