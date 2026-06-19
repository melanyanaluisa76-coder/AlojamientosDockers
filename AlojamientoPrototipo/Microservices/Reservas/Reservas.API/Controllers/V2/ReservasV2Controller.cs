using Microsoft.AspNetCore.Mvc;
using Reservas.API.Filters;
using Reservas.Business.DTOs;
using Reservas.Business.Interfaces;

namespace Reservas.API.Controllers.V2;

/// <summary>
/// Endpoint V2 de reservas con idempotencia obligatoria.
/// Requiere cabecera X-Idempotency-Key (UUID) en cada POST.
/// </summary>
[ApiController]
[Route("api/v2/reservasanaluisa")]
public class ReservasV2Controller : ControllerBase
{
    private readonly IReservasService _service;

    public ReservasV2Controller(IReservasService service) => _service = service;

    [HttpPost]
    [ServiceFilter(typeof(IdempotencyFilter))]
    public async Task<IActionResult> CrearReserva([FromBody] CrearReservaRequest request)
    {
        var result = await _service.CrearAsync(request);
        return Created($"/api/v1/reservasanaluisa/{result.ReservaId}", result);
    }
}
