namespace ArquiFlow.Api.Data.Entities;

public class Expense
{
    public Guid Id { get; set; }

    public Guid BudgetItemId { get; set; }
    public BudgetItem BudgetItem { get; set; } = null!;

    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Description { get; set; }

    public Guid? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }

    public string? ReceiptFileUrl { get; set; }
}
