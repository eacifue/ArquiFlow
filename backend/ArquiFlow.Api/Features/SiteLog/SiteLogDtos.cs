namespace ArquiFlow.Api.Features.SiteLog;

public record SiteLogPhotoDto(Guid Id, string FileUrl, string? Caption);

public record SiteLogEntryDto(
    Guid Id,
    Guid ProjectId,
    DateOnly Date,
    string? Notes,
    string? Weather,
    Guid AuthorUserId,
    string AuthorName,
    string? AuthorRole,
    DateTime CreatedAt,
    IReadOnlyList<SiteLogPhotoDto> Photos);

public record SiteLogPhotoInput(string FileUrl, string? Caption);

public record SaveSiteLogEntryRequest(
    DateOnly Date,
    string? Notes,
    string? Weather,
    List<SiteLogPhotoInput>? Photos);

public record UploadedPhotoDto(string FileUrl);

public class UploadSiteLogPhotoRequest
{
    public IFormFile? File { get; set; }
}
