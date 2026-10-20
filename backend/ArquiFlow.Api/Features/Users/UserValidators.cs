using ArquiFlow.Api.Data.Entities;
using FluentValidation;

namespace ArquiFlow.Api.Features.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Password).MinimumLength(8);
        RuleFor(x => x.Role)
            .Must(role => AppRoles.All.Contains(role))
            .WithMessage($"El rol debe ser uno de: {string.Join(", ", AppRoles.All)}.");
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Role)
            .Must(role => AppRoles.All.Contains(role))
            .WithMessage($"El rol debe ser uno de: {string.Join(", ", AppRoles.All)}.");
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Password).MinimumLength(8);
    }
}
