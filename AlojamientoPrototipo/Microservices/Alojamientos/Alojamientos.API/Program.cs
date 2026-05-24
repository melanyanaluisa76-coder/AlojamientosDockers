using Microsoft.EntityFrameworkCore;
using Alojamientos.DataAccess.Contexts;
using Alojamientos.DataAccess.Entities;
using Alojamientos.API.Extensions;
using Alojamientos.API.Middleware;

AppContext.SetSwitch("System.Net.PreferIPv4Stack", true);
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── 1. Base de datos ─────────────────────────────────
builder.Services.AddDbContext<AlojamientosDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ConexionAlojamientos"))
           .UseLowerCaseNamingConvention());

// ── 2. Dependencias de la Aplicación ─────────────────
builder.Services.AddApplicationServices();

// ── 3. Presentación (Controllers & gRPC) ───────────────
builder.Services.AddControllers();
builder.Services.AddGrpc();

// ── 4. Infraestructura Web (Swagger & CORS) ──────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCustomSwagger();
builder.Services.AddCustomCors();

var app = builder.Build();

// ── Pipeline ─────────────────────────────────────────

// Manejo Global de Excepciones
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger (siempre activo para el prototipo)
app.UseSwagger();
app.UseSwaggerUI();

// CORS
app.UseCors();

app.UseRouting();

// Mapeo de Controladores
app.MapControllers();

// gRPC Service
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });
app.MapGrpcService<Alojamientos.API.GrpcServices.CalendarioGrpcService>()
   .EnableGrpcWeb();

// Seed de catálogos vacíos — FK constraint en producción
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AlojamientosDbContext>();
    db.Database.EnsureCreated();
    if (!db.TiposAlojamiento.Any())
    {
        db.TiposAlojamiento.AddRange(
            new TipoAlojamientoEntity { Nombre = "Hotel",      Descripcion = "Hotel tradicional" },
            new TipoAlojamientoEntity { Nombre = "Hostal",     Descripcion = "Hostal económico" },
            new TipoAlojamientoEntity { Nombre = "Apartamento",Descripcion = "Apartamento turístico" },
            new TipoAlojamientoEntity { Nombre = "Cabaña",     Descripcion = "Cabaña rural" },
            new TipoAlojamientoEntity { Nombre = "Casa",       Descripcion = "Casa completa" }
        );
        db.SaveChanges();
    }
}

app.Run();
