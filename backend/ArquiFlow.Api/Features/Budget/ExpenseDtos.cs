namespace ArquiFlow.Api.Features.Budget;

public record ExpenseDto(
    Guid Id,
    Guid BudgetItemId,
    decimal Amount,
    DateOnly Date,
    string? Description,
    Guid? SupplierId,
    string? SupplierName,
    string? ReceiptFileUrl);

public class CreateExpenseRequest
{
    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Description { get; set; }
    public Guid? SupplierId { get; set; }
    public IFormFile? Receipt { get; set; }
}
