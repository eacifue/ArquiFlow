namespace ArquiFlow.Api.Features.TaskTypes;

public record TaskTypeDto(Guid Id, string Name);

public record CreateTaskTypeRequest(string Name);

public record UpdateTaskTypeRequest(string Name);
