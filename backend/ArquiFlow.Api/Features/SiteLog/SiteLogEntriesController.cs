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

        var entries = await db.SiteLogEntries
            .Where(e => e.ProjectId == projectId)
            .OrderByDescending(e => e.Date).ThenByDescending(e => e.Id)
            .Select(e => new SiteLogEntryDto(
                e.Id, e.ProjectId, e.Date, e.Notes, e.Weather, e.Author.FullName,
                e.Photos.Select(p => new SiteLogPhotoDto(p.Id, p.FileUrl, p.Caption)).ToList()))
            .ToListAsync(ct);

        return Ok(entries);
    }

    // Bitácora entries are append-only, like a physical site log: create or delete,
    // never edit after the fact. Supervisors log from the site; only Admin/PM can delete.
    [HttpPost]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.ProjectManager},{AppRoles.Supervisor}")]
    [RequestSizeLimit(100 * 1024 * 1024)]
    public async Task<ActionResult<SiteLogEntryDto>> Create(Guid projectId, [FromForm] CreateSiteLogEntryRequest request, CancellationToken ct)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, ct);
        if (!projectExists)
        {
            return NotFound();
        }

        var entry = new SiteLogEntry
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Date = request.Date,
            Notes = request.Notes,
            Weather = request.Weather,
            AuthorUserId = User.GetUserId()
        };

        if (request.Photos is not null)
        {
            foreach (var photo in request.Photos)
            {
                await using var stream = photo.OpenReadStream();
                var url = await fileStorage.SaveFileAsync(stream, photo.FileName, ct);
                entry.Photos.Add(new SiteLogPhoto { Id = Guid.NewGuid(), FileUrl = url });
            }
        }

        db.SiteLogEntries.Add(entry);
        await db.SaveChangesAsync(ct);

        var author = await db.Users.Where(u => u.Id == entry.AuthorUserId).Select(u => u.FullName).FirstAsync(ct);
        var dto = new SiteLogEntryDto(entry.Id, entry.ProjectId, entry.Date, entry.Notes, entry.Weather, author,
            entry.Photos.Select(p => new SiteLogPhotoDto(p.Id, p.FileUrl, p.Caption)).ToList());

        return CreatedAtAction(nameof(GetAll), new { projectId }, dto);
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

    private async Task<bool> HasProjectAccessAsync(Guid projectId, CancellationToken ct)
    {
        if (!User.IsInRole(AppRoles.Client))
        {
            return true;
        }

        var userId = User.GetUserId();
        return await db.ProjectClientAccesses.AnyAsync(a => a.ProjectId == projectId && a.ClientUserId == userId, ct);
    }
}
