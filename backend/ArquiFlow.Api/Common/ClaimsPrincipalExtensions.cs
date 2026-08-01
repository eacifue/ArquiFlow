using System.Security.Claims;

namespace ArquiFlow.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        if (value is null || !Guid.TryParse(value, out var id))
        {
            throw new InvalidOperationException("User id claim is missing or invalid.");
        }

        return id;
    }
}
