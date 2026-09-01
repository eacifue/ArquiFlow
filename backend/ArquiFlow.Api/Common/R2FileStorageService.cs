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
            // R2 implements neither of the AWS SDK v4 chunked-signing payload modes
            // ("STREAMING-AWS4-HMAC-SHA256-PAYLOAD[-TRAILER]") — see UseChunkEncoding
            // on the request below for the actual fix.
            RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
            ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
        };
        _client = new AmazonS3Client(credentials, s3Config);
    }

    public async Task<string> SaveFileAsync(Stream content, string fileName, CancellationToken ct = default)
    {
        var key = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";

        // R2 doesn't support the AWS SDK's chunked/streaming SigV4 transfer mode
        // (used automatically for non-seekable or length-unknown streams, e.g. an
        // IFormFile's read stream). Buffering into a MemoryStream gives the SDK a
        // known length and seek support, so it falls back to standard, fully
        // buffered signing instead — which R2 does support.
        var buffered = new MemoryStream();
        await content.CopyToAsync(buffered, ct);
        buffered.Position = 0;

        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = buffered,
            AutoCloseStream = true,
            UseChunkEncoding = false,
            DisablePayloadSigning = true,
        }, ct);

        return $"{_publicBaseUrl}/{key}";
    }
}
