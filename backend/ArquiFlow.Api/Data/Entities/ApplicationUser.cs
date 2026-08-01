using Microsoft.AspNetCore.Identity;

namespace ArquiFlow.Api.Data.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
}
