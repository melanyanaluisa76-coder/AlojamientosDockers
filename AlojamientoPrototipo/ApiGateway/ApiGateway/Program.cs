var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/contract.yaml", "AlojamientoMR Gateway v3.1.0");
    c.RoutePrefix = "swagger";
});

// YARP intercepta todas las rutas configuradas en appsettings.json
// y las redirige al microservicio correspondiente.
app.MapReverseProxy();

app.Run();
