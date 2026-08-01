namespace ArquiFlow.Api.Features.Projects;

public record ProjectClientDto(Guid UserId, string Email, string FullName);

public record InviteProjectClientRequest(string Email, string FullName, string Password);
