using FluentValidation;

namespace ArquiFlow.Api.Features.SiteLog;

public class SaveSiteLogEntryRequestValidator : AbstractValidator<SaveSiteLogEntryRequest>
{
    private const int MaxPhotos = 10;

    public SaveSiteLogEntryRequestValidator()
    {
        RuleFor(x => x.Date)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("La fecha no puede ser futura.");

        RuleFor(x => x.Weather).MaximumLength(50);

        RuleFor(x => x.Photos)
            .Must(photos => photos is null || photos.Count <= MaxPhotos)
            .WithMessage($"Máximo {MaxPhotos} fotos por entrada.");
    }
}

public class UploadSiteLogPhotoRequestValidator : AbstractValidator<UploadSiteLogPhotoRequest>
{
    private const long MaxPhotoBytes = 10 * 1024 * 1024;
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];

    public UploadSiteLogPhotoRequestValidator()
    {
        RuleFor(x => x.File).NotNull().WithMessage("Falta la foto.");

        RuleFor(x => x.File)
            .Must(file => file is null || file.Length <= MaxPhotoBytes)
            .WithMessage("Cada foto no puede superar los 10 MB.");

        RuleFor(x => x.File)
            .Must(file => file is null || AllowedContentTypes.Contains(file.ContentType))
            .WithMessage("Los archivos deben ser imágenes (JPG/PNG/WEBP/HEIC).");
    }
}
