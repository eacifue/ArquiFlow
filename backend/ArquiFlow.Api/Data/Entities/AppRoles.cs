namespace ArquiFlow.Api.Data.Entities;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string ProjectManager = "ProjectManager";
    public const string Supervisor = "Supervisor";
    public const string Client = "Client";

    public static readonly string[] All = [Admin, ProjectManager, Supervisor, Client];
}
