using ArquiFlow.Api.Data.Entities;

namespace ArquiFlow.Api.Features.Payments;

public record PaymentDto(
    Guid Id,
    Guid ProjectId,
    Guid SupplierId,
    string SupplierName,
    Guid? ExpenseId,
    decimal Amount,
    DateOnly Date,
    string? Method,
    PaymentStatus Status);

public record CreatePaymentRequest(
    Guid SupplierId,
    Guid? ExpenseId,
    decimal Amount,
    DateOnly Date,
    string? Method);

public record UpdatePaymentStatusRequest(PaymentStatus Status);
