namespace ArquiFlow.Api.Data.Entities;

public enum PaymentStatus
{
    Pending,
    Paid
}

public class Payment
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    public Guid? ExpenseId { get; set; }
    public Expense? Expense { get; set; }

    public decimal Amount { get; set; }
    public DateOnly Date { get; set; }
    public string? Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
}
