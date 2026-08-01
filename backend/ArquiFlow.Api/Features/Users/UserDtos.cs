namespace ArquiFlow.Api.Features.Users;

public record UserDto(Guid Id, string Email, string FullName, IList<string> Roles);

public record CreateUserRequest(string Email, string FullName, string Password, string Role);
