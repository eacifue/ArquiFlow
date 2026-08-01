using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectClientAccess> ProjectClientAccesses => Set<ProjectClientAccess>();
    public DbSet<BudgetItem> BudgetItems => Set<BudgetItem>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ScheduleTask> ScheduleTasks => Set<ScheduleTask>();
    public DbSet<SiteLogEntry> SiteLogEntries => Set<SiteLogEntry>();
    public DbSet<SiteLogPhoto> SiteLogPhotos => Set<SiteLogPhoto>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Project>(e =>
        {
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.Property(p => p.TotalBudget).HasColumnType("numeric(14,2)");
        });

        builder.Entity<BudgetItem>(e =>
        {
            e.Property(p => p.BudgetedAmount).HasColumnType("numeric(14,2)");
            e.HasOne(p => p.Project)
                .WithMany(p => p.BudgetItems)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Expense>(e =>
        {
            e.Property(p => p.Amount).HasColumnType("numeric(14,2)");
            e.HasOne(p => p.BudgetItem)
                .WithMany(p => p.Expenses)
                .HasForeignKey(p => p.BudgetItemId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Supplier)
                .WithMany()
                .HasForeignKey(p => p.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ScheduleTask>(e =>
        {
            e.HasOne(p => p.Project)
                .WithMany(p => p.ScheduleTasks)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<SiteLogEntry>(e =>
        {
            e.HasOne(p => p.Project)
                .WithMany(p => p.SiteLogEntries)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Author)
                .WithMany()
                .HasForeignKey(p => p.AuthorUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<SiteLogPhoto>(e =>
        {
            e.HasOne(p => p.SiteLogEntry)
                .WithMany(p => p.Photos)
                .HasForeignKey(p => p.SiteLogEntryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Payment>(e =>
        {
            e.Property(p => p.Amount).HasColumnType("numeric(14,2)");
            e.HasOne(p => p.Project)
                .WithMany(p => p.Payments)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Supplier)
                .WithMany(p => p.Payments)
                .HasForeignKey(p => p.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Expense)
                .WithMany()
                .HasForeignKey(p => p.ExpenseId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ProjectClientAccess>(e =>
        {
            e.HasOne(p => p.Project)
                .WithMany(p => p.ClientAccesses)
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.ClientUser)
                .WithMany()
                .HasForeignKey(p => p.ClientUserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(p => new { p.ProjectId, p.ClientUserId }).IsUnique();
        });
    }
}
