using ApiGateway.Consumers;
using ApiGateway.GraphQL;
using ApiGateway.Hubs;
using MassTransit;
using Shared.Kernel.Events;

var builder = WebApplication.CreateBuilder(args);

// ── YARP ─────────────────────────────────────────────
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// ── CORS (SignalR requiere credenciales → origen explícito en producción) ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ── SignalR ───────────────────────────────────────────
builder.Services.AddSignalR();

// ── GraphQL (HotChocolate) ────────────────────────────
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>();

// ── HttpClient para resolvedores GraphQL ─────────────
var alojamientosUrl = builder.Configuration["ServiceUrls:Alojamientos"]
    ?? "https://alojamientosalojamientos.onrender.com";

builder.Services.AddHttpClient("alojamientos", c =>
{
    c.BaseAddress = new Uri(alojamientosUrl);
});

// ── Event Bus (MassTransit + RabbitMQ) ───────────────
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<ReservaCreadaGatewayConsumer>();
    x.AddConsumer<FacturaPagadaGatewayConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rmqUrl = builder.Configuration.GetConnectionString("RabbitMQ");
        if (!string.IsNullOrEmpty(rmqUrl))
        {
            cfg.Host(new Uri(rmqUrl));
        }
        else
        {
            cfg.Host("localhost", "/", h =>
            {
                h.Username("guest");
                h.Password("guest");
            });
        }

        // Cola exclusiva del Gateway para no interferir con las colas de los microservicios
        cfg.ReceiveEndpoint("gateway-notifications", e =>
        {
            e.ConfigureConsumer<ReservaCreadaGatewayConsumer>(context);
            e.ConfigureConsumer<FacturaPagadaGatewayConsumer>(context);
        });
    });
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseStaticFiles();

// Swagger UI (contrato existente)
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/contract.yaml", "AlojamientoMR Gateway v3.1.0");
    c.RoutePrefix = "swagger";
});

// ── Endpoints ─────────────────────────────────────────
app.MapHub<NotificationHub>("/hub/notifications");
app.MapGraphQL("/graphql");
app.MapReverseProxy();

app.Run();
