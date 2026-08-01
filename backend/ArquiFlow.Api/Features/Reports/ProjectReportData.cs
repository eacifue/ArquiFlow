namespace ArquiFlow.Api.Features.Reports;

public record BudgetItemSummary(string Category, string Description, decimal Budgeted, decimal Spent);

public record ScheduleTaskSummary(string Name, DateOnly StartDate, DateOnly EndDate, int ProgressPercent, string Status);

public record SiteLogPhotoSummary(DateOnly Date, string PhysicalFilePath, string? Caption);

public record ProjectReportData(
    string ProjectName,
    string? Address,
    string Status,
    DateOnly? StartDate,
    DateOnly? EndDate,
    decimal TotalBudget,
    IReadOnlyList<BudgetItemSummary> BudgetItems,
    IReadOnlyList<ScheduleTaskSummary> ScheduleTasks,
    IReadOnlyList<SiteLogPhotoSummary> RecentPhotos);
