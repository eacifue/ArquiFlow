namespace ArquiFlow.Api.Data.Entities;

public class SiteLogPhoto
{
    public Guid Id { get; set; }

    public Guid SiteLogEntryId { get; set; }
    public SiteLogEntry SiteLogEntry { get; set; } = null!;

    public string FileUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
}
