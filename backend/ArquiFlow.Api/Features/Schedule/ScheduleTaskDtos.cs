using ArquiFlow.Api.Data.Entities;

namespace ArquiFlow.Api.Features.Schedule;

public record ScheduleTaskDto(
    Guid Id,
    Guid ProjectId,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int ProgressPercent,
    ScheduleTaskStatus Status,
    int SortOrder);

public record CreateScheduleTaskRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int SortOrder);

public record UpdateScheduleTaskRequest(
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    int ProgressPercent,
    int SortOrder);

// Lightweight endpoint for drag-to-update interactions from the Gantt view
// (moving a bar's dates or dragging its progress handle) without requiring
// the full edit form's payload.
public record UpdateScheduleTaskScheduleRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    int ProgressPercent);
