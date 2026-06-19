using ApiGateway.Hubs;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Shared.Kernel.Events;

namespace ApiGateway.Consumers;

/// <summary>
/// Escucha FacturaPagadaEvent del bus de RabbitMQ y hace broadcast en tiempo real
/// via SignalR a todos los clientes Angular conectados al NotificationHub.
/// </summary>
public class FacturaPagadaGatewayConsumer : IConsumer<FacturaPagadaEvent>
{
    private readonly IHubContext<NotificationHub> _hub;
    private readonly ILogger<FacturaPagadaGatewayConsumer> _logger;

    public FacturaPagadaGatewayConsumer(IHubContext<NotificationHub> hub, ILogger<FacturaPagadaGatewayConsumer> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<FacturaPagadaEvent> context)
    {
        var ev = context.Message;

        _logger.LogInformation(
            "📡 Gateway broadcast OnFacturaPagadaEvent: ReservaId={ReservaId}, FacturaId={FacturaId}",
            ev.ReservaId, ev.FacturaId);

        await _hub.Clients.All.SendAsync("OnFacturaPagadaEvent", new
        {
            reservaId = ev.ReservaId,
            facturaId = ev.FacturaId,
            montoPagado = ev.MontoPagado,
            fechaPago = ev.FechaPago
        });
    }
}
