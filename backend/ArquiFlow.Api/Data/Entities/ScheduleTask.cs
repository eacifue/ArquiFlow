namespace ArquiFlow.Api.Data.Entities;

public enum ScheduleTaskStatus
{
    NotStarted,
    InProgress,
    Done,
    Delayed
}

// Deliberately simple: no dependency graph, matches the "lightweight Gantt" scope.
public class ScheduleTask
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int ProgressPercent { get; set; }
    public ScheduleTaskStatus Status { get; set; } = ScheduleTaskStatus.NotStarted;
    public int SortOrder { get; set; }
}
