using ArquiFlow.Api.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ArquiFlow.Api.Data;

public static class DbSeeder
{
    // Seeded once, from the task names already used by test data plus the
    // real construction task list the studio provided. Purely a starting
    // point: Admin owns this list from here on via the TaskTypes CRUD.
    private static readonly string[] InitialTaskTypes =
    [
        "Estructura y mampostería",
        "Excavación y fundaciones",
        "Instalaciones eléctricas y sanitarias",
        "Revoque y terminaciones",
        "mamposeria",
        "pruebz",
        "Fundaciones",
        "Estructura",
        "Mampostería",
        "Redes",
        "Revoque",
        "Mortero de piso",
        "Estuco",
        "Pintura primera mano",
        "Enchapes",
        "Pisos",
        "Cielo falso",
        "Instalación Ventanería",
        "Instalación pasamanos",
        "Carpintería madera",
        "Aparatos sanitarios y eléctricos",
        "Punto fijo",
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in AppRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        var db = services.GetRequiredService<AppDbContext>();
        if (!await db.TaskTypes.AnyAsync())
        {
            db.TaskTypes.AddRange(InitialTaskTypes.Select(name => new TaskType { Id = Guid.NewGuid(), Name = name }));
            await db.SaveChangesAsync();
        }

        var config = services.GetRequiredService<IConfiguration>();
        var adminEmail = config["SeedAdmin:Email"];
        var adminPassword = config["SeedAdmin:Password"];
        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        if (await userManager.FindByEmailAsync(adminEmail) is not null)
        {
            return;
        }

        var admin = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            FullName = "Administrador"
        };

        var result = await userManager.CreateAsync(admin, adminPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, AppRoles.Admin);
        }
    }
}
