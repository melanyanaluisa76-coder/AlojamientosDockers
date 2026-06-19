using ApiGateway.Hubs;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Shared.Kernel.Events;

namespace ApiGateway.Consumers;

/// <summary>
/// Escucha ReservaCreadaEvent del bus de RabbitMQ y hace broadcast en tiempo real
/// via SignalR a todos los clientes Angular conectados al NotificationHub.
/// </summary>
public class ReservaCreadaGatewayConsumer : IConsumer<ReservaCreadaEvent>
{
    private readonly IHubContext<NotificationHub> _hub;
    private readonly ILogger<ReservaCreadaGatewayConsumer> _logger;

    public ReservaCreadaGatewayConsumer(IHubContext<NotificationHub> hub, ILogger<ReservaCreadaGatewayConsumer> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ReservaCreadaEvent> context)
    {
        var ev = context.Message;

        _logger.LogInformation(
            "📡 Gateway broadcast OnReservaCreadaEvent: ReservaId={ReservaId}, Código={Codigo}",
            ev.ReservaId, ev.CodigoReserva);

        await _hub.Clients.All.SendAsync("OnReservaCreadaEvent", new
        {
            reservaId = ev.ReservaId,
            codigoReserva = ev.CodigoReserva,
            clienteId = ev.ClienteId,
            alojamientoId = ev.AlojamientoId,
            fechaCheckIn = ev.FechaCheckIn.ToString("yyyy-MM-dd"),
            fechaCheckOut = ev.FechaCheckOut.ToString("yyyy-MM-dd"),
            total = ev.Total,
            fechaCreacion = ev.FechaCreacion
        });
    }
}
