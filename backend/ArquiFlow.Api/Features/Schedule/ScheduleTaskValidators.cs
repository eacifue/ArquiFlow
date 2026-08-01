using FluentValidation;

namespace ArquiFlow.Api.Features.Schedule;

public class CreateScheduleTaskRequestValidator : AbstractValidator<CreateScheduleTaskRequest>
{
    public CreateScheduleTaskRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("La fecha de fin no puede ser anterior a la fecha de inicio.");
    }
}

public class UpdateScheduleTaskRequestValidator : AbstractValidator<UpdateScheduleTaskRequest>
{
    public UpdateScheduleTaskRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("La fecha de fin no puede ser anterior a la fecha de inicio.");
        RuleFor(x => x.ProgressPercent).InclusiveBetween(0, 100);
    }
}

public class UpdateScheduleTaskScheduleRequestValidator : AbstractValidator<UpdateScheduleTaskScheduleRequest>
{
    public UpdateScheduleTaskScheduleRequestValidator()
    {
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("La fecha de fin no puede ser anterior a la fecha de inicio.");
        RuleFor(x => x.ProgressPercent).InclusiveBetween(0, 100);
    }
}
