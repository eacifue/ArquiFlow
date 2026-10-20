namespace ArquiFlow.Api.Features.Users;

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    IList<string> Roles,
    bool AllProjects,
    IReadOnlyList<string> Projects,
    DateTime? LastLoginAt);

public record CreateUserRequest(string Email, string FullName, string Password, string Role);

public record UpdateUserRequest(string Email, string FullName, string Role);

public record ResetPasswordRequest(string Password);
