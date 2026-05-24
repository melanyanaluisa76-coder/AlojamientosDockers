using System.ComponentModel.DataAnnotations;

namespace ApiGateway.Models;

// ── Alojamientos ──────────────────────────────────────────────────────
public record CrearAlojamientoRequest
{
    [Required] public int SocioId { get; init; }
    [Required] public int TipoAlojamientoId { get; init; }
    [Required] public string Nombre { get; init; } = string.Empty;
    public string? Ciudad { get; init; }
    [Required] public string Direccion { get; init; } = string.Empty;
    public string? Descripcion { get; init; }
    public bool AdmiteMascotas { get; init; }
    public bool TienePiscina { get; init; }
    public bool TieneParqueadero { get; init; }
}

public record ActualizarAlojamientoRequest
{
    [Required] public string Nombre { get; init; } = string.Empty;
    public string? Ciudad { get; init; }
    [Required] public string Direccion { get; init; } = string.Empty;
    public string? Descripcion { get; init; }
    [Required] public int TipoAlojamientoId { get; init; }
    public int? Estrellas { get; init; }
    public bool AdmiteMascotas { get; init; }
    public bool TienePiscina { get; init; }
    public bool TieneParqueadero { get; init; }
}

public record AlojamientoResponse
{
    public int AlojamientoId { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public string Estado { get; init; } = string.Empty;
}

// ── Habitaciones ──────────────────────────────────────────────────────
public record CrearHabitacionRequest
{
    [Required] public int AlojamientoId { get; init; }
    [Required] public string Nombre { get; init; } = string.Empty;
    public string? Descripcion { get; init; }
    [Required] public decimal PrecioPorNoche { get; init; }
    [Required] public int CapacidadAdultos { get; init; }
    public int CapacidadNinos { get; init; }
    public int NumDormitorios { get; init; }
    public int NumBanos { get; init; }
    public bool TieneCocina { get; init; }
    public bool TieneAireAcondicionado { get; init; }
    public double? SuperficieM2 { get; init; }
}

public record HabitacionResponse
{
    public int HabitacionId { get; init; }
    public string Nombre { get; init; } = string.Empty;
    public decimal PrecioPorNoche { get; init; }
}

// ── Calendario ────────────────────────────────────────────────────────
public record BloquearFechasRequest
{
    [Required] public int HabitacionId { get; init; }
    [Required] public DateOnly FechaInicio { get; init; }
    [Required] public DateOnly FechaFin { get; init; }
}

public record CalendarioResponse
{
    public int CalendarioId { get; init; }
    public int HabitacionId { get; init; }
    public DateOnly Fecha { get; init; }
    public string Estado { get; init; } = string.Empty;
}

// ── Clientes ──────────────────────────────────────────────────────────
public record RegistrarClienteRequest
{
    [Required] public string Email { get; init; } = string.Empty;
    [Required] public string Password { get; init; } = string.Empty;
    [Required] public string NombreCompleto { get; init; } = string.Empty;
    [Required] public string Cedula { get; init; } = string.Empty;
    [Required] public string Telefono { get; init; } = string.Empty;
    [Required] public string Domicilio { get; init; } = string.Empty;
}

public record ActualizarClienteRequest
{
    public string? NombreCompleto { get; init; }
    public string? Telefono { get; init; }
    public string? Domicilio { get; init; }
}

public record ClienteResponse
{
    public int ClienteId { get; init; }
    public string NombreCompleto { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}

// ── Reservas ──────────────────────────────────────────────────────────
public record CrearReservaRequest
{
    [Required] public int ClienteId { get; init; }
    [Required] public int AlojamientoId { get; init; }
    [Required] public DateOnly FechaCheckIn { get; init; }
    [Required] public DateOnly FechaCheckOut { get; init; }
    [Required] public int NumAdultos { get; init; }
    public int NumNinos { get; init; }
    public bool LlevaMascotas { get; init; }
    public string? CodigoDescuento { get; init; }
    [Required] public List<DetalleHabitacionRequest> Habitaciones { get; init; } = new();
}

public record DetalleHabitacionRequest
{
    [Required] public int HabitacionId { get; init; }
    [Required] public decimal PrecioPorNoche { get; init; }
    [Required] public int NumNoches { get; init; }
}

public record ActualizarEstadoReservaRequest
{
    [Required] public string Estado { get; init; } = string.Empty;
}

public record ReservaResponse
{
    public int ReservaId { get; init; }
    public string CodigoReserva { get; init; } = string.Empty;
    public string Estado { get; init; } = string.Empty;
    public decimal Total { get; init; }
}

// ── Facturación ───────────────────────────────────────────────────────
public record CrearFacturaRequest
{
    [Required] public int ReservaId { get; init; }
    public int? MetodoPagoId { get; init; }
    [Required] public decimal Monto { get; init; }
    public DateTime? FechaPago { get; init; }
    [Required] public List<CrearDetalleFacturaRequest> Detalles { get; init; } = new();
}

public record CrearDetalleFacturaRequest
{
    [Required] public string Descripcion { get; init; } = string.Empty;
    [Required] public int Cantidad { get; init; }
    [Required] public decimal PrecioUnitario { get; init; }
}

public record FacturaResponse
{
    public int FacturaId { get; init; }
    public int ReservaId { get; init; }
    public decimal Monto { get; init; }
    public string Estado { get; init; } = string.Empty;
}

public record MetodoPagoResponse
{
    public int MetodoPagoId { get; init; }
    public string Tipo { get; init; } = string.Empty;
}
