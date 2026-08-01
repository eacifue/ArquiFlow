namespace ArquiFlow.Api.Data.Entities;

public class Supplier
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? TaxId { get; set; }
    public string? Category { get; set; }

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
