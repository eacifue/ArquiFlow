namespace ArquiFlow.Api.Common;

// Abstraction so the MVP can start with local disk storage and move to
// S3 / Azure Blob / Cloudinary later without touching calling code.
public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream content, string fileName, CancellationToken ct = default);
}
