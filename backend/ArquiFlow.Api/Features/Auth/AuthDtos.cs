namespace ArquiFlow.Api.Features.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, string Email, string FullName, IList<string> Roles);
