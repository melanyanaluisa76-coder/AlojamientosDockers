using Microsoft.EntityFrameworkCore;
using Facturacion.DataAccess.Contexts;
using Facturacion.DataAccess.Entities;
using Facturacion.API.Extensions;
using Facturacion.API.Middleware;
using MassTransit;

AppContext.SetSwitch("System.Net.PreferIPv4Stack", true);
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ── 1. Base de datos ─────────────────────────────────
builder.Services.AddDbContext<FacturacionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ConexionFacturacion"))
           .UseLowerCaseNamingConvention());

// ── 2. Dependencias de la Aplicación ─────────────────
builder.Services.AddApplicationServices();

// ── Event Bus (MassTransit + RabbitMQ) ───────────────
builder.Services.AddMassTransit(x =>
{
    x.UsingRabbitMq((context, cfg) =>
    {
        // Se espera "amqps://user:pass@host/vhost" desde appsettings.json o variables de entorno
        var rmqUrl = builder.Configuration.GetConnectionString("RabbitMQ");
        if (!string.IsNullOrEmpty(rmqUrl))
        {
            cfg.Host(new Uri(rmqUrl));
        }
        else
        {
            // Fallback para desarrollo local si no hay nube configurada
            cfg.Host("localhost", "/", h =>
            {
                h.Username("guest");
                h.Password("guest");
            });
        }
        
        cfg.ConfigureEndpoints(context);
    });
});

// ── 3. Presentación (Controllers) ────────────────────
builder.Services.AddControllers();

// ── 4. Infraestructura Web (Swagger & CORS) ──────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCustomSwagger();
builder.Services.AddCustomCors();

var app = builder.Build();

// ── Pipeline ─────────────────────────────────────────

// Manejo Global de Excepciones
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

// CORS
app.UseCors();

// Mapeo de Controladores
app.MapControllers();

// Seed de catálogos vacíos — FK constraint en producción
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FacturacionDbContext>();
    db.Database.EnsureCreated();
    if (!db.MetodosPago.Any())
    {
        db.MetodosPago.AddRange(
            new MetodoPagoClienteEntity { Tipo = "DEBITO" },
            new MetodoPagoClienteEntity { Tipo = "CREDITO" },
            new MetodoPagoClienteEntity { Tipo = "EnSitio" }
        );
        db.SaveChanges();
    }
}

app.Run();
