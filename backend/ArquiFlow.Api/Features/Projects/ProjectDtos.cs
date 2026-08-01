using ArquiFlow.Api.Data.Entities;

namespace ArquiFlow.Api.Features.Projects;

public record ProjectDto(
    Guid Id,
    string Name,
    string? Address,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    ProjectStatus Status,
    decimal TotalBudget);

public record CreateProjectRequest(
    string Name,
    string? Address,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    decimal TotalBudget);

public record UpdateProjectRequest(
    string Name,
    string? Address,
    string? Description,
    DateOnly? StartDate,
    DateOnly? EndDate,
    decimal TotalBudget,
    ProjectStatus Status);
