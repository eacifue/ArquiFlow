namespace ArquiFlow.Api.Data.Entities;

public class BudgetItem
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BudgetedAmount { get; set; }
    public string? Unit { get; set; }
    public decimal? Quantity { get; set; }

    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
