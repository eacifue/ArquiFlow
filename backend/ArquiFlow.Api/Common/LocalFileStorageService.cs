namespace ArquiFlow.Api.Common;

public class LocalFileStorageService : IFileStorageService
{
    private const string PublicBasePath = "/uploads";
    private readonly string _rootPath;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _rootPath = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveFileAsync(Stream content, string fileName, CancellationToken ct = default)
    {
        var safeName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var fullPath = Path.Combine(_rootPath, safeName);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, ct);

        return $"{PublicBasePath}/{safeName}";
    }
}
