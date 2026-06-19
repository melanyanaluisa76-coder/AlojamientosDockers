using System.Text.Json;

namespace ApiGateway.GraphQL;

/// <summary>
/// Query raíz de GraphQL expuesta en /graphql.
/// Agrega en una sola consulta alojamientos + habitaciones evitando múltiples roundtrips REST.
/// </summary>
public class Query
{
    /// <summary>Retorna el catálogo completo de alojamientos.</summary>
    public async Task<List<AlojamientoGql>> GetAlojamientos(
        [Service] IHttpClientFactory httpFactory)
    {
        var client = httpFactory.CreateClient("alojamientos");
        var json = await client.GetStringAsync("/api/v1/alojamientosanaluisa");
        var doc = JsonDocument.Parse(json);
        var items = doc.RootElement.TryGetProperty("data", out var data) ? data : doc.RootElement;

        var result = new List<AlojamientoGql>();
        foreach (var el in items.EnumerateArray())
            result.Add(MapAlojamiento(el));
        return result;
    }

    /// <summary>Retorna un alojamiento por id con sus habitaciones anidadas.</summary>
    public async Task<AlojamientoGql?> GetAlojamiento(
        int id,
        [Service] IHttpClientFactory httpFactory)
    {
        var client = httpFactory.CreateClient("alojamientos");

        var alojJson = await client.GetStringAsync($"/api/v1/alojamientosanaluisa/{id}");
        var alojDoc = JsonDocument.Parse(alojJson);
        var alojEl = alojDoc.RootElement.TryGetProperty("data", out var d) ? d : alojDoc.RootElement;
        var alojamiento = MapAlojamiento(alojEl);

        var habJson = await client.GetStringAsync($"/api/v1/habitacionesanaluisa/alojamiento/{id}");
        var habDoc = JsonDocument.Parse(habJson);
        var habItems = habDoc.RootElement.TryGetProperty("data", out var hd) ? hd : habDoc.RootElement;

        foreach (var el in habItems.EnumerateArray())
            alojamiento.Habitaciones.Add(MapHabitacion(el));

        return alojamiento;
    }

    private static AlojamientoGql MapAlojamiento(JsonElement el) => new()
    {
        Id = el.TryGetProperty("alojamientoId", out var aid) ? aid.GetInt32() : 0,
        Nombre = el.TryGetProperty("nombre", out var n) ? n.GetString() ?? "" : "",
        Descripcion = el.TryGetProperty("descripcion", out var desc) ? desc.GetString() ?? "" : "",
        Tipo = el.TryGetProperty("tipo", out var t) ? t.GetString() ?? "" : "",
        Direccion = el.TryGetProperty("direccion", out var dir) ? dir.GetString() ?? "" : "",
        ImagenUrl = el.TryGetProperty("imagenUrl", out var img) ? img.GetString() : null,
        Activo = el.TryGetProperty("activo", out var act) && act.GetBoolean()
    };

    private static HabitacionGql MapHabitacion(JsonElement el) => new()
    {
        Id = el.TryGetProperty("habitacionId", out var hid) ? hid.GetInt32() : 0,
        Numero = el.TryGetProperty("numero", out var num) ? num.GetString() ?? "" : "",
        Tipo = el.TryGetProperty("tipo", out var t) ? t.GetString() ?? "" : "",
        Capacidad = el.TryGetProperty("capacidad", out var cap) ? cap.GetInt32() : 0,
        PrecioPorNoche = el.TryGetProperty("precioPorNoche", out var p) ? p.GetDecimal() : 0
    };
}

public class AlojamientoGql
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string? ImagenUrl { get; set; }
    public bool Activo { get; set; }
    public List<HabitacionGql> Habitaciones { get; set; } = [];
}

public class HabitacionGql
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public int Capacidad { get; set; }
    public decimal PrecioPorNoche { get; set; }
}
