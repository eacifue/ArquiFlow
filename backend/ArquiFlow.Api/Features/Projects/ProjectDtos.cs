using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data.Entities;

namespace ArquiFlow.Api.Features.Projects;

public record PersonRef(Guid Id, string FullName);

public record ProjectDto(
    Guid Id,
    string Name,
    string? Address,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    ProjectStatus Status,
    decimal TotalBudget,
    PersonRef? ProjectManager,
    PersonRef? Supervisor,
    ProjectMetrics Metrics);

public record StaffMemberDto(Guid Id, string FullName, string Role);

public record CreateProjectRequest(
    string Name,
    string? Address,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    decimal TotalBudget,
    Guid? ProjectManagerId,
    Guid? SupervisorId);

public record UpdateProjectRequest(
    string Name,
    string? Address,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    decimal TotalBudget,
    ProjectStatus Status,
    Guid? ProjectManagerId,
    Guid? SupervisorId);
