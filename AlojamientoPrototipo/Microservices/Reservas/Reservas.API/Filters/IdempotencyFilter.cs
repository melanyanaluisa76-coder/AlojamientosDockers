using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;

namespace Reservas.API.Filters;

/// <summary>
/// Filtro de idempotencia para endpoints transaccionales.
/// Exige cabecera X-Idempotency-Key (UUID).
/// - Bloquea peticiones concurrentes con la misma clave → 409 Conflict
/// - Devuelve el resultado cacheado en reintentos → evita doble cargo/reserva
/// - Libera la clave si la ejecución falla → permite corregir y reintentar
/// </summary>
public class IdempotencyFilter : IAsyncActionFilter
{
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(60);
    private const string HeaderName = "X-Idempotency-Key";
    private const string Processing = "processing";

    public IdempotencyFilter(IMemoryCache cache) => _cache = cache;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var rawKey)
            || string.IsNullOrWhiteSpace(rawKey))
        {
            context.Result = new BadRequestObjectResult(new
            {
                success = false,
                message = $"La cabecera '{HeaderName}' es obligatoria y debe ser un UUID válido."
            });
            return;
        }

        var key = rawKey.ToString().Trim();

        if (_cache.TryGetValue(key, out var cached))
        {
            // Petición concurrente en vuelo → 409
            if (cached is string s && s == Processing)
            {
                context.Result = new ConflictObjectResult(new
                {
                    success = false,
                    message = "Petición duplicada: la solicitud original aún está siendo procesada."
                });
                return;
            }

            // Reintento con clave ya resuelta → devolver resultado cacheado
            if (cached is string cachedJson)
            {
                context.Result = new ContentResult
                {
                    Content = cachedJson,
                    ContentType = "application/json",
                    StatusCode = 200
                };
                return;
            }
        }

        // Marcar como "en proceso" con TTL corto para evitar bloqueo infinito ante crash
        _cache.Set(key, Processing, TimeSpan.FromSeconds(30));

        ActionExecutedContext executed;
        try
        {
            executed = await next();
        }
        catch
        {
            _cache.Remove(key);
            throw;
        }

        if (executed.Result is ObjectResult { StatusCode: >= 200 and < 300 } ok)
        {
            var json = JsonSerializer.Serialize(ok.Value);
            _cache.Set(key, json, CacheExpiry);
        }
        else
        {
            _cache.Remove(key);
        }
    }
}
