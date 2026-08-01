namespace ArquiFlow.Api.Data.Entities;

// Scopes a Client-role user to the specific projects they're allowed to see.
public class ProjectClientAccess
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public Guid ClientUserId { get; set; }
    public ApplicationUser ClientUser { get; set; } = null!;
}
