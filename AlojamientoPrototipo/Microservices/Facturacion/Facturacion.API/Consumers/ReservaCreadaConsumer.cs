using Facturacion.Business.DTOs;
using Facturacion.Business.Interfaces;
using MassTransit;
using Shared.Kernel.Events;

namespace Facturacion.API.Consumers;

/// <summary>
/// Genera automáticamente una factura en estado "Pendiente" cuando se crea una reserva.
/// Idempotencia: verifica si ya existe una factura para ese ReservaId antes de insertar,
/// lo que previene duplicados ante re-entregas de RabbitMQ (At-Least-Once delivery).
/// </summary>
public class ReservaCreadaConsumer : IConsumer<ReservaCreadaEvent>
{
    private readonly IFacturasService _facturasService;
    private readonly ILogger<ReservaCreadaConsumer> _logger;

    public ReservaCreadaConsumer(IFacturasService facturasService, ILogger<ReservaCreadaConsumer> logger)
    {
        _facturasService = facturasService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ReservaCreadaEvent> context)
    {
        var ev = context.Message;

        _logger.LogInformation(
            "📩 ReservaCreadaEvent recibido: ReservaId={ReservaId}, Código={Codigo}, Total={Total}",
            ev.ReservaId, ev.CodigoReserva, ev.Total);

        // Idempotencia: si ya existe una factura para esta reserva, no crear duplicado
        var existentes = await _facturasService.GetByReservaIdAsync(ev.ReservaId);
        if (existentes.Any())
        {
            _logger.LogInformation(
                "⏭️ Factura ya existe para ReservaId={ReservaId}. Evento descartado (idempotencia).",
                ev.ReservaId);
            return;
        }

        var detalles = ev.Habitaciones.Select(h => new CrearDetalleFacturaRequest
        {
            Descripcion = $"Habitación {h.HabitacionId} — {h.NumNoches} noche(s) x ${h.PrecioPorNoche:F2}",
            Cantidad = h.NumNoches,
            PrecioUnitario = h.PrecioPorNoche
        }).ToList();

        // Agregar línea de IVA (15%)
        var iva = Math.Round(ev.SubTotal * 0.15m, 2);
        detalles.Add(new CrearDetalleFacturaRequest
        {
            Descripcion = "IVA 15%",
            Cantidad = 1,
            PrecioUnitario = iva
        });

        var request = new CrearFacturaRequest
        {
            ReservaId = ev.ReservaId,
            Monto = ev.Total,
            Detalles = detalles
        };

        try
        {
            var factura = await _facturasService.CrearAsync(request);
            _logger.LogInformation(
                "✅ Factura {FacturaId} creada automáticamente para ReservaId={ReservaId}",
                factura.FacturaId, ev.ReservaId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "❌ Error creando factura automática para ReservaId={ReservaId}",
                ev.ReservaId);
            throw; // MassTransit reintentará según política de retry
        }
    }
}
