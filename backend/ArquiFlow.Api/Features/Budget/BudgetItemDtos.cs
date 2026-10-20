namespace ArquiFlow.Api.Features.Budget;

public record BudgetItemDto(
    Guid Id,
    Guid ProjectId,
    string Category,
    string Description,
    decimal BudgetedAmount,
    string? Unit,
    decimal? Quantity,
    decimal SpentAmount,
    IReadOnlyList<ExpenseDto> Expenses);

public record CreateBudgetItemRequest(
    string Category,
    string Description,
    decimal BudgetedAmount,
    string? Unit,
    decimal? Quantity);

public record UpdateBudgetItemRequest(
    string Category,
    string Description,
    decimal BudgetedAmount,
    string? Unit,
    decimal? Quantity);
