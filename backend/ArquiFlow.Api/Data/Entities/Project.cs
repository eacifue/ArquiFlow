namespace ArquiFlow.Api.Data.Entities;

public enum ProjectStatus
{
    Planning,
    InProgress,
    OnHold,
    Completed,
    Cancelled
}

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Description { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public decimal TotalBudget { get; set; }

    public ICollection<BudgetItem> BudgetItems { get; set; } = new List<BudgetItem>();
    public ICollection<ScheduleTask> ScheduleTasks { get; set; } = new List<ScheduleTask>();
    public ICollection<SiteLogEntry> SiteLogEntries { get; set; } = new List<SiteLogEntry>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<ProjectClientAccess> ClientAccesses { get; set; } = new List<ProjectClientAccess>();
}
