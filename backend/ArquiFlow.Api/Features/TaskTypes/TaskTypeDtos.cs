namespace ArquiFlow.Api.Features.TaskTypes;

public record TaskTypeDto(Guid Id, string Name, int ProjectCount);

public record CreateTaskTypeRequest(string Name);

public record UpdateTaskTypeRequest(string Name);
