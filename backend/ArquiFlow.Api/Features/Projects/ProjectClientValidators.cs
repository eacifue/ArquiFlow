using FluentValidation;

namespace ArquiFlow.Api.Features.Projects;

public class InviteProjectClientRequestValidator : AbstractValidator<InviteProjectClientRequest>
{
    public InviteProjectClientRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Password).MinimumLength(8);
    }
}
