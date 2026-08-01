using ArquiFlow.Api.Data.Entities;
using FluentValidation;

namespace ArquiFlow.Api.Features.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    // Client users aren't created here — they're created via the project invite flow
    // (Features/Projects/ProjectClientsController), scoped to a project from the start.
    private static readonly string[] AssignableRoles =
        [AppRoles.Admin, AppRoles.ProjectManager, AppRoles.Supervisor];

    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Password).MinimumLength(8);
        RuleFor(x => x.Role)
            .Must(role => AssignableRoles.Contains(role))
            .WithMessage($"El rol debe ser uno de: {string.Join(", ", AssignableRoles)}.");
    }
}
