using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace ArquiFlow.Api.Common;

public class R2StorageOptions
{
    public const string SectionName = "FileStorage:R2";

    public string AccountId { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string PublicBaseUrl { get; set; } = string.Empty;
}

// Cloudflare R2 is S3-compatible: same AmazonS3Client, only the ServiceURL and
// forced path-style addressing change. Swapped in from Program.cs only when
// FileStorage:R2:BucketName is configured — LocalFileStorageService otherwise.
public class R2FileStorageService : IFileStorageService
{
    private readonly AmazonS3Client _client;
    private readonly string _bucketName;
    private readonly string _publicBaseUrl;

    public R2FileStorageService(IOptions<R2StorageOptions> options)
    {
        var config = options.Value;
        _bucketName = config.BucketName;
        _publicBaseUrl = config.PublicBaseUrl.TrimEnd('/');

        var credentials = new BasicAWSCredentials(config.AccessKeyId, config.SecretAccessKey);
        var s3Config = new AmazonS3Config
        {
            ServiceURL = $"https://{config.AccountId}.r2.cloudflarestorage.com",
            ForcePathStyle = true,
        };
        _client = new AmazonS3Client(credentials, s3Config);
    }

    public async Task<string> SaveFileAsync(Stream content, string fileName, CancellationToken ct = default)
    {
        var key = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";

        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = content,
            AutoCloseStream = false,
        }, ct);

        return $"{_publicBaseUrl}/{key}";
    }
}
