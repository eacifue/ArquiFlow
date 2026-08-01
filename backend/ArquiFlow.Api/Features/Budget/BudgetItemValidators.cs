using FluentValidation;

namespace ArquiFlow.Api.Features.Budget;

public class CreateBudgetItemRequestValidator : AbstractValidator<CreateBudgetItemRequest>
{
    public CreateBudgetItemRequestValidator()
    {
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(500);
        RuleFor(x => x.BudgetedAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0).When(x => x.Quantity.HasValue);
    }
}

public class UpdateBudgetItemRequestValidator : AbstractValidator<UpdateBudgetItemRequest>
{
    public UpdateBudgetItemRequestValidator()
    {
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(500);
        RuleFor(x => x.BudgetedAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0).When(x => x.Quantity.HasValue);
    }
}
