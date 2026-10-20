using ArquiFlow.Api.Common;
using ArquiFlow.Api.Data;
using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Features.SiteLog;

[ApiController]
[Route("api/projects/{projectId:guid}/site-log-entries")]
[Authorize]
public class SiteLogEntriesController(AppDbContext db, IFileStorageService fileStorage) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SiteLogEntryDto>>> GetAll(Guid projectId, CancellationToken ct)
    {
        if (!await HasProjectAccessAsync(projectId, ct))
        {
            return NotFound();
        }

        var entries = await QueryEntries()
            .Where(e => e.ProjectId == projectId)
            .ToListAsync(ct);

        return Ok(await ToDtosAsync(entries, ct));
    }

    // Photos upload on their own as soon as they're picked, so the entry can be
    // saved while they're still uploading; the entry then references the URLs.
    [HttpPost("photos")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<UploadedPhotoDto>> UploadPhoto(Guid projectId, [FromForm] UploadSiteLogPhotoRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        await using var stream = request.File!.OpenReadStream();
        var url = await fileStorage.SaveFileAsync(stream, request.File.FileName, ct);

        return Ok(new UploadedPhotoDto(url));
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    public async Task<ActionResult<SiteLogEntryDto>> Create(Guid projectId, SaveSiteLogEntryRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        if (!PhotosAreStored(request))
        {
            return BadRequest("Hay fotos que no se subieron a ArquiFlow.");
        }

        var entry = new SiteLogEntry
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Date = request.Date,
            Notes = request.Notes,
            Weather = request.Weather,
            AuthorUserId = User.GetUserId(),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var photo in request.Photos ?? [])
        {
            entry.Photos.Add(new SiteLogPhoto { Id = Guid.NewGuid(), FileUrl = photo.FileUrl, Caption = photo.Caption });
        }

        db.SiteLogEntries.Add(entry);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetAll), new { projectId }, await LoadDtoAsync(entry.Id, ct));
    }

    // Authors can correct their own entries; Admin/PM can correct anyone's.
    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    public async Task<ActionResult<SiteLogEntryDto>> Update(Guid projectId, Guid id, SaveSiteLogEntryRequest request, CancellationToken ct)
    {
        var entry = await db.SiteLogEntries
            .Include(e => e.Photos)
            .FirstOrDefaultAsync(e => e.ProjectId == projectId && e.Id == id, ct);

        if (entry is null)
        {
            return NotFound();
        }

        var isManager = User.IsInRole(AppRoles.Admin) || User.IsInRole(AppRoles.ProjectManager);
        if (!isManager && entry.AuthorUserId != User.GetUserId())
        {
            return Forbid();
        }

        if (!PhotosAreStored(request))
        {
            return BadRequest("Hay fotos que no se subieron a ArquiFlow.");
        }

        entry.Date = request.Date;
        entry.Notes = request.Notes;
        entry.Weather = request.Weather;

        var incoming = request.Photos ?? [];
        var keptUrls = incoming.Select(p => p.FileUrl).ToHashSet();
        db.SiteLogPhotos.RemoveRange(entry.Photos.Where(p => !keptUrls.Contains(p.FileUrl)));

        foreach (var photo in incoming)
        {
            var existing = entry.Photos.FirstOrDefault(p => p.FileUrl == photo.FileUrl);
            if (existing is null)
            {
                db.SiteLogPhotos.Add(new SiteLogPhoto
                {
                    Id = Guid.NewGuid(),
                    SiteLogEntryId = entry.Id,
                    FileUrl = photo.FileUrl,
                    Caption = photo.Caption
                });
            }
            else
            {
                existing.Caption = photo.Caption;
            }
        }

        await db.SaveChangesAsync(ct);

        return Ok(await LoadDtoAsync(entry.Id, ct));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager}")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id, CancellationToken ct)
    {
        var entry = await db.SiteLogEntries.FirstOrDefaultAsync(e => e.ProjectId == projectId && e.Id == id, ct);
        if (entry is null)
        {
            return NotFound();
        }

        db.SiteLogEntries.Remove(entry);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private bool PhotosAreStored(SaveSiteLogEntryRequest request) =>
        (request.Photos ?? []).All(p => fileStorage.IsStoredFileUrl(p.FileUrl));

    private IQueryable<EntryRow> QueryEntries() =>
        db.SiteLogEntries
            .OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt)
            .Select(e => new EntryRow(
                e.Id, e.ProjectId, e.Date, e.Notes, e.Weather, e.AuthorUserId, e.Author.FullName, e.CreatedAt,
                e.Photos.Select(p => new SiteLogPhotoDto(p.Id, p.FileUrl, p.Caption)).ToList()));

    private async Task<SiteLogEntryDto> LoadDtoAsync(Guid id, CancellationToken ct)
    {
        var row = await QueryEntries().FirstAsync(e => e.Id == id, ct);
        return (await ToDtosAsync([row], ct))[0];
    }

    private async Task<List<SiteLogEntryDto>> ToDtosAsync(List<EntryRow> rows, CancellationToken ct)
    {
        var authorIds = rows.Select(r => r.AuthorUserId).Distinct().ToList();
        var roles = await db.UserRoles
            .Where(ur => authorIds.Contains(ur.UserId))
            .Join(db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
            .ToListAsync(ct);

        return rows.Select(r => new SiteLogEntryDto(
                r.Id, r.ProjectId, r.Date, r.Notes, r.Weather, r.AuthorUserId, r.AuthorName,
                roles.FirstOrDefault(x => x.UserId == r.AuthorUserId)?.Name,
                r.CreatedAt, r.Photos))
            .ToList();
    }

    private async Task<bool> HasProjectAccessAsync(Guid projectId, CancellationToken ct)
    {
        if (!User.IsInRole(AppRoles.Client))
        {
            return true;
        }

        var userId = User.GetUserId();
        return await db.ProjectClientAccesses.AnyAsync(a => a.ProjectId == projectId && a.ClientUserId == userId, ct);
    }

    private record EntryRow(
        Guid Id,
        Guid ProjectId,
        DateOnly Date,
        string? Notes,
        string? Weather,
        Guid AuthorUserId,
        string AuthorName,
        DateTime CreatedAt,
        List<SiteLogPhotoDto> Photos);
}
