namespace Shared.Kernel.Events;

public record ReservaCreadaEvent
{
    public int ReservaId { get; init; }
    public string CodigoReserva { get; init; } = string.Empty;
    public int ClienteId { get; init; }
    public int AlojamientoId { get; init; }
    public DateOnly FechaCheckIn { get; init; }
    public DateOnly FechaCheckOut { get; init; }
    public decimal SubTotal { get; init; }
    public decimal Total { get; init; }
    public DateTime FechaCreacion { get; init; }
    public List<DetalleReservaCreadaEvent> Habitaciones { get; init; } = [];
}

public record DetalleReservaCreadaEvent
{
    public int HabitacionId { get; init; }
    public decimal PrecioPorNoche { get; init; }
    public int NumNoches { get; init; }
    public decimal SubTotalHabitacion { get; init; }
}
