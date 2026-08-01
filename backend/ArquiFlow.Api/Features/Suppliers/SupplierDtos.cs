namespace ArquiFlow.Api.Features.Suppliers;

public record SupplierDto(
    Guid Id,
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? TaxId,
    string? Category);

public record CreateSupplierRequest(
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? TaxId,
    string? Category);

public record UpdateSupplierRequest(
    string Name,
    string? ContactName,
    string? Phone,
    string? Email,
    string? TaxId,
    string? Category);
