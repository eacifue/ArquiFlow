namespace ArquiFlow.Api.Data.Entities;

public class SiteLogEntry
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public DateOnly Date { get; set; }
    public string? Notes { get; set; }
    public string? Weather { get; set; }

    public Guid AuthorUserId { get; set; }
    public ApplicationUser Author { get; set; } = null!;

    public ICollection<SiteLogPhoto> Photos { get; set; } = new List<SiteLogPhoto>();
}
