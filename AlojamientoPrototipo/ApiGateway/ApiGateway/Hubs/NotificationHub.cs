using Microsoft.AspNetCore.SignalR;

namespace ApiGateway.Hubs;

/// <summary>
/// Hub de WebSockets para notificaciones en tiempo real hacia el frontend Angular.
/// Los clientes se suscriben y reciben broadcasts cuando cambia el estado del sistema.
/// Eventos emitidos:
///   - OnReservaCreadaEvent  → nueva reserva registrada
///   - OnFacturaPagadaEvent  → factura aprobada / reserva confirmada
/// </summary>
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
