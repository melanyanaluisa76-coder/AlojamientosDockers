using ApiGateway.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "AlojamientoMR — API Gateway (naomy-analuisa)", Version = "v3.1.0" });
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

// ════════════════════════════════════════════════════════════════════
// STUBS PARA SWAGGER — YARP intercepta la llamada real antes de que
// lleguen aquí y la redirige al microservicio correspondiente.
// ════════════════════════════════════════════════════════════════════

// ── Alojamientos ─────────────────────────────────────────────────────
app.MapGet("/api/v1/naomy-analuisa/alojamientos", () => Results.Ok(Array.Empty<AlojamientoResponse>()))
    .WithTags("Alojamientos").WithSummary("Listar todos los alojamientos").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/alojamientos/{id:int}", (int id) => Results.Ok(new AlojamientoResponse()))
    .WithTags("Alojamientos").WithSummary("Detalle de un alojamiento").WithOpenApi();

app.MapPost("/api/v1/naomy-analuisa/alojamientos", (CrearAlojamientoRequest req) => Results.Created("/", new AlojamientoResponse()))
    .WithTags("Alojamientos").WithSummary("Registrar nuevo alojamiento").WithOpenApi();

app.MapPut("/api/v1/naomy-analuisa/alojamientos/{id:int}", (int id, ActualizarAlojamientoRequest req) => Results.NoContent())
    .WithTags("Alojamientos").WithSummary("Actualizar alojamiento").WithOpenApi();

app.MapDelete("/api/v1/naomy-analuisa/alojamientos/{id:int}", (int id) => Results.NoContent())
    .WithTags("Alojamientos").WithSummary("Eliminar alojamiento").WithOpenApi();

// ── Habitaciones ─────────────────────────────────────────────────────
app.MapGet("/api/v1/naomy-analuisa/habitaciones/alojamiento/{alojamientoId:int}", (int alojamientoId) => Results.Ok(Array.Empty<HabitacionResponse>()))
    .WithTags("Habitaciones").WithSummary("Habitaciones de un alojamiento").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/habitaciones/{id:int}", (int id) => Results.Ok(new HabitacionResponse()))
    .WithTags("Habitaciones").WithSummary("Detalle de una habitación").WithOpenApi();

app.MapPost("/api/v1/naomy-analuisa/habitaciones", (CrearHabitacionRequest req) => Results.Created("/", new HabitacionResponse()))
    .WithTags("Habitaciones").WithSummary("Registrar nueva habitación").WithOpenApi();

app.MapDelete("/api/v1/naomy-analuisa/habitaciones/{id:int}", (int id) => Results.NoContent())
    .WithTags("Habitaciones").WithSummary("Eliminar habitación").WithOpenApi();

// ── Calendario / Disponibilidad ───────────────────────────────────────
app.MapGet("/api/v1/naomy-analuisa/calendario/habitacion/{habitacionId:int}", (int habitacionId, int mes, int anio) => Results.Ok(Array.Empty<CalendarioResponse>()))
    .WithTags("Disponibilidad").WithSummary("Disponibilidad mensual de una habitación").WithOpenApi();

app.MapPost("/api/v1/naomy-analuisa/calendario/bloquear", (BloquearFechasRequest req) => Results.Ok(Array.Empty<CalendarioResponse>()))
    .WithTags("Disponibilidad").WithSummary("Bloquear rango de fechas").WithOpenApi();

// ── Clientes ──────────────────────────────────────────────────────────
app.MapPost("/api/v1/naomy-analuisa/clientes/registrar", (RegistrarClienteRequest req) => Results.Created("/", new {}))
    .WithTags("Clientes").WithSummary("Registrar nuevo huésped").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/clientes/cedula/{cedula}", (string cedula) => Results.Ok(new ClienteResponse()))
    .WithTags("Clientes").WithSummary("Buscar huésped por cédula").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/clientes/{clienteId:int}", (int clienteId) => Results.Ok(new ClienteResponse()))
    .WithTags("Clientes").WithSummary("Perfil completo del huésped").WithOpenApi();

app.MapPut("/api/v1/naomy-analuisa/clientes/{clienteId:int}", (int clienteId, ActualizarClienteRequest req) => Results.Ok(new {}))
    .WithTags("Clientes").WithSummary("Actualizar perfil del huésped").WithOpenApi();

// ── Reservas (Booking) ────────────────────────────────────────────────
app.MapPost("/api/v1/naomy-analuisa/booking", (CrearReservaRequest req) => Results.Created("/", new ReservaResponse()))
    .WithTags("Reservas (Booking)").WithSummary("Crear nueva reserva").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/booking/{id:int}", (int id) => Results.Ok(new ReservaResponse()))
    .WithTags("Reservas (Booking)").WithSummary("Consultar reserva por ID").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/booking/cliente/{clienteId:int}", (int clienteId) => Results.Ok(Array.Empty<ReservaResponse>()))
    .WithTags("Reservas (Booking)").WithSummary("Historial de reservas del huésped").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/booking/resumen/cliente/{clienteId:int}", (int clienteId) => Results.Ok(Array.Empty<ReservaResponse>()))
    .WithTags("Reservas (Booking)").WithSummary("Resumen ligero de reservas").WithOpenApi();

app.MapPatch("/api/v1/naomy-analuisa/booking/{id:int}/estado", (int id, ActualizarEstadoReservaRequest req) => Results.NoContent())
    .WithTags("Reservas (Booking)").WithSummary("Actualizar estado de una reserva").WithOpenApi();

// ── Facturación ───────────────────────────────────────────────────────
app.MapGet("/api/v1/naomy-analuisa/metodospago", () => Results.Ok(Array.Empty<MetodoPagoResponse>()))
    .WithTags("Facturación").WithSummary("Métodos de pago disponibles").WithOpenApi();

app.MapPost("/api/v1/naomy-analuisa/facturas", (CrearFacturaRequest req) => Results.Created("/", new FacturaResponse()))
    .WithTags("Facturación").WithSummary("Crear factura para una reserva").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/facturas/reserva/{reservaId:int}", (int reservaId) => Results.Ok(new FacturaResponse()))
    .WithTags("Facturación").WithSummary("Comprobante de pago de una reserva").WithOpenApi();

app.MapGet("/api/v1/naomy-analuisa/facturas/resumen/reserva/{reservaId:int}", (int reservaId) => Results.Ok(new FacturaResponse()))
    .WithTags("Facturación").WithSummary("Resumen liviano de factura").WithOpenApi();

// ════════════════════════════════════════════════════════════════════
app.MapReverseProxy();

app.Run();
