namespace ArquiFlow.Api.Features.Projects;

public record ProjectClientDto(Guid UserId, string Email, string FullName, DateTime InvitedAt, DateTime? LastLoginAt);

public record InviteProjectClientRequest(string Email, string FullName, string Password);
