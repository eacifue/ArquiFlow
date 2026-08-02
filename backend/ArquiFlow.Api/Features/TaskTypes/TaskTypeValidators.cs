using FluentValidation;

namespace ArquiFlow.Api.Features.TaskTypes;

public class CreateTaskTypeRequestValidator : AbstractValidator<CreateTaskTypeRequest>
{
    public CreateTaskTypeRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}

public class UpdateTaskTypeRequestValidator : AbstractValidator<UpdateTaskTypeRequest>
{
    public UpdateTaskTypeRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}
