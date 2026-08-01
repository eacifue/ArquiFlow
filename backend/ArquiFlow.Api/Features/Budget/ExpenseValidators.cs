using FluentValidation;

namespace ArquiFlow.Api.Features.Budget;

public class CreateExpenseRequestValidator : AbstractValidator<CreateExpenseRequest>
{
    private const long MaxReceiptBytes = 10 * 1024 * 1024;
    private static readonly string[] AllowedReceiptContentTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

    public CreateExpenseRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Date)
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("La fecha del gasto no puede ser futura.");

        RuleFor(x => x.Receipt)
            .Must(file => file is null || file.Length <= MaxReceiptBytes)
            .WithMessage("El comprobante no puede superar los 10 MB.");

        RuleFor(x => x.Receipt)
            .Must(file => file is null || AllowedReceiptContentTypes.Contains(file.ContentType))
            .WithMessage("El comprobante debe ser una imagen (JPG/PNG/WEBP/HEIC) o un PDF.");
    }
}
