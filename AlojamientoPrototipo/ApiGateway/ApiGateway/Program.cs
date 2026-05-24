using ApiGateway.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "AlojamientoMR — API Gateway (naomy-analuisa)",
        Version = "v3.1.0",
        Description = "Prefijo de integración: /api/v1/naomy-analuisa/ — Ver contrato completo en alojamiento-booking-integration-contract-analuisa.yaml"
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AlojamientoMR Gateway v3.1.0");
});

// YARP intercepta todas las rutas configuradas en appsettings.json
// y las redirige al microservicio correspondiente.
app.MapReverseProxy();

app.Run();
