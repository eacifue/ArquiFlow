namespace ArquiFlow.Api.Features.Budget;

public record ExpenseDto(
    Guid Id,
    Guid BudgetItemId,
    decimal Amount,
    DateOnly Date,
    string? Description,
    string? ReceiptFileUrl);

public class CreateExpenseRequest
{
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Description { get; set; }
    public IFormFile? Receipt { get; set; }
}
