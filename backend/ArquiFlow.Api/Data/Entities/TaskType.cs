namespace ArquiFlow.Api.Data.Entities;

// Master list of task names an Admin curates, so schedule tasks are picked
// from a controlled vocabulary instead of free text.
public class TaskType
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
