// ============================================================
// .NET 8 Minimal API — Notification System
// File: NotificationApi.cs
// ============================================================
//
// Usage: Copy this into your .NET 8 Web API project.
// Register with: app.MapNotificationEndpoints();
//
// Prerequisites:
//   - Entity Framework Core with SQL Server
//   - Microsoft.AspNetCore.Authorization
//   - System.Security.Claims
// ============================================================

// ──────────────────────────────────────────────
// 1. MODELS
// ──────────────────────────────────────────────

namespace Insurance.Api.Models;

public class NotificationType
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string DefaultTone { get; set; } = "info";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int TypeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    // Navigation
    public NotificationType Type { get; set; } = null!;
}

// ──────────────────────────────────────────────
// 2. DTOs
// ──────────────────────────────────────────────

namespace Insurance.Api.DTOs;

public record NotificationDto(
    Guid Id,
    string Title,
    string? Description,
    string TypeCode,
    string? Icon,
    string Tone,
    string? ReferenceId,
    string? ReferenceType,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt
);

public record CreateNotificationRequest(
    Guid UserId,
    string TypeCode,
    string Title,
    string? Description = null,
    string? ReferenceId = null,
    string? ReferenceType = null
);

public record UnreadCountDto(int Count);

public record MarkReadRequest(List<Guid>? NotificationIds = null);

// ──────────────────────────────────────────────
// 3. DbContext Configuration
// ──────────────────────────────────────────────

namespace Insurance.Api.Data;

using Microsoft.EntityFrameworkCore;
using Insurance.Api.Models;

// Add to your existing DbContext:
//
// public DbSet<Notification> Notifications => Set<Notification>();
// public DbSet<NotificationType> NotificationTypes => Set<NotificationType>();
//
// In OnModelCreating:
public static class NotificationDbConfig
{
    public static void ConfigureNotifications(this ModelBuilder builder)
    {
        builder.Entity<NotificationType>(e =>
        {
            e.ToTable("NotificationTypes");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
        });

        builder.Entity<Notification>(e =>
        {
            e.ToTable("Notifications");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.IsRead });
            e.HasIndex(x => x.CreatedAt).IsDescending();
            e.HasOne(x => x.Type)
             .WithMany()
             .HasForeignKey(x => x.TypeId);
        });
    }
}

// ──────────────────────────────────────────────
// 4. API ENDPOINTS
// ──────────────────────────────────────────────

namespace Insurance.Api.Endpoints;

using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Insurance.Api.DTOs;
using Insurance.Api.Models;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/notifications")
            .RequireAuthorization()
            .WithTags("Notifications");

        // GET /api/notifications — List user notifications (paginated)
        group.MapGet("/", async (
            HttpContext ctx,
            DbContext db, // Replace with your actual DbContext type
            int page = 1,
            int pageSize = 20,
            bool? unreadOnly = null
        ) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var query = db.Set<Notification>()
                .Include(n => n.Type)
                .Where(n => n.UserId == userId.Value)
                .Where(n => n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow);

            if (unreadOnly == true)
                query = query.Where(n => !n.IsRead);

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new NotificationDto(
                    n.Id, n.Title, n.Description,
                    n.Type.Code, n.Type.Icon, n.Type.DefaultTone,
                    n.ReferenceId, n.ReferenceType,
                    n.IsRead, n.ReadAt, n.CreatedAt
                ))
                .ToListAsync();

            return Results.Ok(new { items, total, page, pageSize });
        });

        // GET /api/notifications/unread-count
        group.MapGet("/unread-count", async (HttpContext ctx, DbContext db) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var count = await db.Set<Notification>()
                .CountAsync(n => n.UserId == userId.Value && !n.IsRead);

            return Results.Ok(new UnreadCountDto(count));
        });

        // POST /api/notifications/mark-read — Mark specific or all as read
        group.MapPost("/mark-read", async (HttpContext ctx, DbContext db, MarkReadRequest request) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var query = db.Set<Notification>()
                .Where(n => n.UserId == userId.Value && !n.IsRead);

            if (request.NotificationIds?.Any() == true)
                query = query.Where(n => request.NotificationIds.Contains(n.Id));

            var notifications = await query.ToListAsync();

            foreach (var n in notifications)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { marked = notifications.Count });
        });

        // POST /api/notifications — Create notification (internal/admin use)
        group.MapPost("/", async (DbContext db, CreateNotificationRequest request) =>
        {
            var type = await db.Set<NotificationType>()
                .FirstOrDefaultAsync(t => t.Code == request.TypeCode);

            if (type == null)
                return Results.BadRequest(new { error = $"Unknown type: {request.TypeCode}" });

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                TypeId = type.Id,
                Title = request.Title,
                Description = request.Description,
                ReferenceId = request.ReferenceId,
                ReferenceType = request.ReferenceType,
            };

            db.Set<Notification>().Add(notification);
            await db.SaveChangesAsync();

            return Results.Created($"/api/notifications/{notification.Id}", new NotificationDto(
                notification.Id, notification.Title, notification.Description,
                type.Code, type.Icon, type.DefaultTone,
                notification.ReferenceId, notification.ReferenceType,
                notification.IsRead, notification.ReadAt, notification.CreatedAt
            ));
        });

        // DELETE /api/notifications/{id}
        group.MapDelete("/{id:guid}", async (HttpContext ctx, DbContext db, Guid id) =>
        {
            var userId = GetUserId(ctx);
            if (userId == null) return Results.Unauthorized();

            var notification = await db.Set<Notification>()
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId.Value);

            if (notification == null) return Results.NotFound();

            db.Set<Notification>().Remove(notification);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });
    }

    private static Guid? GetUserId(HttpContext ctx)
    {
        var claim = ctx.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}

// ──────────────────────────────────────────────
// 5. REGISTRATION (in Program.cs)
// ──────────────────────────────────────────────
//
// var builder = WebApplication.CreateBuilder(args);
//
// // Add DbContext with notification config
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
//
// builder.Services.AddAuthentication().AddJwtBearer();
// builder.Services.AddAuthorization();
//
// var app = builder.Build();
//
// app.UseAuthentication();
// app.UseAuthorization();
//
// app.MapNotificationEndpoints();  // <-- Register notification routes
//
// app.Run();
