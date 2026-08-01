using FluentValidation;

namespace ArquiFlow.Api.Features.SiteLog;

public class CreateSiteLogEntryRequestValidator : AbstractValidator<CreateSiteLogEntryRequest>
{
    private const long MaxPhotoBytes = 10 * 1024 * 1024;
    private const int MaxPhotos = 10;
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];

    public CreateSiteLogEntryRequestValidator()
    {
        RuleFor(x => x.Date)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("La fecha no puede ser futura.");

        RuleFor(x => x.Photos)
            .Must(photos => photos is null || photos.Count <= MaxPhotos)
            .WithMessage($"Máximo {MaxPhotos} fotos por entrada.");

        RuleFor(x => x.Photos)
            .Must(photos => photos is null || photos.All(p => p.Length <= MaxPhotoBytes))
            .WithMessage("Cada foto no puede superar los 10 MB.");

        RuleFor(x => x.Photos)
            .Must(photos => photos is null || photos.All(p => AllowedContentTypes.Contains(p.ContentType)))
            .WithMessage("Los archivos deben ser imágenes (JPG/PNG/WEBP/HEIC).");
    }
}
