namespace ArquiFlow.Api.Features.SiteLog;

public record SiteLogPhotoDto(Guid Id, string FileUrl, string? Caption);

public record SiteLogEntryDto(
    Guid Id,
    Guid ProjectId,
    DateOnly Date,
    string? Notes,
    string? Weather,
    string AuthorName,
    IReadOnlyList<SiteLogPhotoDto> Photos);

public class CreateSiteLogEntryRequest
{
    public DateOnly Date { get; set; }
    public string? Notes { get; set; }
    public string? Weather { get; set; }
    public List<IFormFile>? Photos { get; set; }
}
