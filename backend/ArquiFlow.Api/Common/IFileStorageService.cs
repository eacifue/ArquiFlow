namespace ArquiFlow.Api.Common;

// Abstraction so the MVP can start with local disk storage and move to
// S3 / Azure Blob / Cloudinary later without touching calling code.
public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream content, string fileName, CancellationToken ct = default);

    // True when the URL points at a file this service stored, so clients can't
    // attach arbitrary external URLs to records that reference uploaded files.
    bool IsStoredFileUrl(string url);
}
