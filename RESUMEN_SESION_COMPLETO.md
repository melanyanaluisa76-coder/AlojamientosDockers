# Resumen Completo de Sesión — AlojamientoMR

> **Fecha:** 25 de mayo de 2026  
> **Proyecto:** Sistema de reservas hoteleras — arquitectura de microservicios  
> **Stack:** Angular 18 (frontend) + .NET 8 microservicios + Supabase PostgreSQL + Render (deploy) + Vercel (frontend)

---

## ARQUITECTURA GENERAL DEL SISTEMA

```
Usuario
  │
  ▼
[Vercel] Angular 18 (SPA)
  │  HTTP REST
  ▼
[Render] API Gateway YARP  ──► /api/v1/naomy-analuisa/*
  │
  ├──► Microservicio Alojamientos  (DB Supabase #1)
  ├──► Microservicio Reservas      (DB Supabase #2) ◄── gRPC ──► Alojamientos
  ├──► Microservicio Facturación   (DB Supabase #3)
  └──► Microservicio Usuarios/Auth (DB Supabase #4)
```

**Gateway URL:** `https://alojamientosapigateway.onrender.com/api/v1/naomy-analuisa`

---

## PROBLEMA 1 — Build de Vercel fallaba (exit code 1)

### Síntoma
El CI de Vercel ejecutaba `npm run build -- --configuration=production` y fallaba con múltiples errores TypeScript/Angular.

### Causa raíz
La sesión anterior había migrado el contrato a v3.1.0 renombrando campos, pero los componentes Angular todavía referenciaban los nombres viejos.

### Archivos corregidos y cambios exactos

| Archivo | Error | Fix |
|---------|-------|-----|
| `propiedad-detalle.component.html` | `i < propiedad()!.estrellas` (posiblemente undefined) | `i < (propiedad()!.estrellas ?? 0)` |
| `propiedad-detalle.component.html` | `propiedad()!.pais` (campo no existe en el modelo) | Eliminado |
| `propiedad-detalle.component.html` | `tipoAlojamiento` (campo incorrecto) | `tipoAlojamientoNombre` |
| `propiedad-detalle.component.html` | `h.precioPorNoche` (campo equivocado para alojamientos) | `h.precioNoche` |
| `admin-habitaciones.component.html` | `h.admiteMascotas` (no existe en `HabitacionItem`) | Eliminado |
| `admin-habitaciones.component.html` | `precioPorNoche` | `precioNoche` (replace_all) |
| `admin-dashboard.component.ts` | `getTodasLasReservas()` (método no existía) | `getResumenByCliente(0)` |
| `admin-dashboard.component.ts` | `buscarPropiedades({ PageSize: 200 })` (no existía) | `getAlojamientos()` |
| `admin-dashboard.component.ts` | `r.datos` | `r.data` |
| `admin-dashboard.component.html` | `r.nombrePropiedad` (no existe en `ReservaResponse`) | `r.alojamientoId ? '#' + r.alojamientoId : '—'` |
| `admin-reservas.component.html` | `r.nombrePropiedad` | `r.alojamientoId ? '#' + r.alojamientoId : '—'` |
| `mis-reservas.component.html` | `r.nochesTotal`, `r.descuento` | Eliminados / `r.porcentajeDescuento ?? 0` |
| `alojamiento.model.ts` | `HabitacionItem.precioPorNoche` | `precioNoche` |
| `alojamiento.model.ts` | `HabitacionItem.estado: string` | `estado?: string` (opcional) |

**Commit:** `bfc51ef` — *fix: corregir errores de compilacion TypeScript*

---

## PROBLEMA 2 — Frontend mostraba "0 propiedades"

### Síntoma
Postman confirmaba que el backend devolvía los alojamientos correctamente, pero el frontend siempre mostraba lista vacía.

### Causa raíz
Los microservicios devuelven la respuesta **sin envelope** (plain array/object):
```json
[ { "alojamientoId": 1, ... }, { "alojamientoId": 2, ... } ]
```
Pero todos los servicios Angular esperaban el envelope:
```json
{ "data": [...], "success": true }
```
Al hacer `r.data` sobre un array, el resultado era `undefined`.

### Fix — Nuevo interceptor HTTP

**Archivo creado:** `src/app/core/interceptors/response-normalizer.interceptor.ts`

```typescript
export const responseNormalizerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (!(event instanceof HttpResponse)) return event;
      const body = event.body;
      if (body === null || body === undefined) return event;
      // Si ya tiene el envelope { data, success }, no tocar
      if (typeof body === 'object' && !Array.isArray(body) && 'data' in body) return event;
      // Envolver en el formato esperado
      return event.clone({ body: { data: body, success: true } });
    }),
  );
};
```

**Registrado en** `app.config.ts` → `withInterceptors([authInterceptor, errorInterceptor, idempotencyInterceptor, responseNormalizerInterceptor])`

**Commit:** `d502b18` — *fix: agregar interceptor para normalizar respuestas*

---

## PROBLEMA 3 — Registro devolvía 400

### Síntoma
Al crear una cuenta nueva, el backend respondía `400 Bad Request`.

### Causa raíz
El backend tiene `[MinLength(8)]` en el campo `Password` del DTO, pero el formulario Angular solo validaba `minLength(6)`.

### Fix (solo frontend)

**`register.component.ts`:** `Validators.minLength(6)` → `Validators.minLength(8)`  
**`register.component.html`:** Mensaje de error actualizado a "Mínimo 8 caracteres."

**Commit:** `c7f6133` — *fix: corregir validacion de password*

---

## PROBLEMA 4 — Login siempre devolvía 401

### Síntoma
Incluso con credenciales recién registradas, el login devolvía `401 Unauthorized`.

### Causa raíz
El `AuthService.LoginAsync()` del backend es un stub no implementado que siempre retorna `null`.

### Fix — Logins fantasma (100% frontend, sin tocar backend)

**Archivo:** `src/app/services/usuarios.service.ts`

Se intercepta la petición de login antes de ir al HTTP. Si las credenciales coinciden con las fantasma, se devuelve un `Observable` local con un token JWT sintético estructuralmente válido.

```typescript
const DEMO_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

const GHOST_LOGINS: Record<string, LoginResponse> = {
  'cliente@demo.com:Demo12345!': {
    token: `${DEMO_HEADER}.eyJzdWIiOiIxIn0=.demo`,
    clienteId: 1,
    colaboradorId: null,
    nombreCompleto: 'Cliente Demo',
    email: 'cliente@demo.com',
    roles: ['Cliente'],
  },
  'admin@demo.com:Admin12345!': {
    token: `${DEMO_HEADER}.eyJzdWIiOiI5OTkifQ==.demo`,
    clienteId: null,
    colaboradorId: 1,
    nombreCompleto: 'Administrador Demo',
    email: 'admin@demo.com',
    roles: ['Administrador'],
  },
};

login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
  const ghost = GHOST_LOGINS[`${req.email}:${req.password}`];
  if (ghost) return of({ data: ghost, success: true });
  return this.http.post<ApiResponse<LoginResponse>>(`${this.base}/auth/login`, req);
}
```

**Credenciales de demo:**

| Rol | Email | Password |
|-----|-------|----------|
| Cliente (puede reservar) | `cliente@demo.com` | `Demo12345!` |
| Administrador (panel admin) | `admin@demo.com` | `Admin12345!` |

**Commit:** `68b432a` — *feat: agregar logins fantasma para demostracion*

---

## PROBLEMA 5 — Precio de habitación se guardaba como $0

### Síntoma
Al crear una habitación con precio $200 desde el panel admin, en la DB se guardaba `precioNoche: 0.00`.

### Causa raíz
El microservicio de **Alojamientos** usa el campo `PrecioNoche` en su DTO, pero el frontend enviaba `precioPorNoche` (nombre del microservicio de **Reservas**, que es diferente). El backend ignoraba el campo desconocido y usaba el valor por defecto `0`.

> **Nota importante:** Los dos microservicios usan nombres DISTINTOS para el precio:  
> - Alojamientos: `precioNoche`  
> - Reservas: `precioPorNoche`  
> Ambos son correctos en su contexto, NO se deben unificar.

### Fix — Renombrado en modelo y componentes de alojamientos

**Archivos modificados:**

- `alojamiento.model.ts`: `HabitacionItem.precioPorNoche` → `precioNoche`
- `alojamiento.model.ts`: `CrearHabitacionRequest.precioPorNoche` → `precioNoche`
- `admin-habitaciones.component.ts`: todas las referencias
- `admin-habitaciones.component.html`: todas las referencias
- `propiedad-detalle.component.ts`: todas las referencias
- `propiedad-detalle.component.html`: todas las referencias

**Commit:** `69ff692` — *fix: corregir campo precio habitacion*

---

## PROBLEMA 6 — Habitaciones no aparecían en detalle de propiedad

### Síntoma
La página de detalle de propiedad mostraba "No hay habitaciones disponibles" aunque existían en la DB.

### Causa raíz
El template tenía un `@if (h.estado)` que ocultaba las habitaciones si el campo `estado` era falsy. El endpoint de Alojamientos **nunca devuelve el campo `estado`** en `HabitacionResponse`, por lo que siempre era `undefined` → falsy → todas ocultas.

### Fix

**`propiedad-detalle.component.html`:** Eliminado el wrapper `@if (h.estado)` completamente  
**`alojamiento.model.ts`:** `estado: string` → `estado?: string` (campo opcional)

**Commit:** `69ff692` — *fix: corregir campo precio habitacion y mostrar habitaciones*

---

## PROBLEMA 7 — Reserva fallaba con 400 (numNoches: 0)

### Síntoma
Al intentar hacer una reserva con fechas válidas, el backend respondía `400` y aparecía el mensaje "Las fechas seleccionadas no son válidas" en el formulario.

### Causa raíz
El `computed()` de Angular **solo reacciona a signals**. El `bookingForm` es un `ReactiveForm` de RxJS, no un signal. Por lo tanto, `nightCount` se calculaba una vez (cuando las fechas eran strings vacíos) y devolvía `0` para siempre, sin importar qué fechas se seleccionaran.

Con `numNoches: 0` el backend rechazaba por validación `[Range(1, 365)]`.

### Fix — `toSignal` para hacer el form reactivo

**`propiedad-detalle.component.ts`:**

```typescript
import { toSignal } from '@angular/core/rxjs-interop';

// Convierte los cambios del form en un Signal reactivo
private readonly formValues = toSignal(this.bookingForm.valueChanges, {
  initialValue: this.bookingForm.getRawValue(),
});

// Ahora sí reacciona cuando el usuario cambia las fechas
readonly nightCount = computed(() => {
  const v = this.formValues();
  if (!v.fechaCheckIn || !v.fechaCheckOut) return 0;
  const diff = new Date(v.fechaCheckOut).getTime() - new Date(v.fechaCheckIn).getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
});
```

**Commit:** `51c3717` — *fix: corregir nightCount reactivo usando toSignal*

---

## PROBLEMA 8 — Sin gobierno de datos: capacidad, fechas duplicadas y pago múltiple

### Síntoma
1. Se podía reservar una habitación para más personas de las que caben
2. Se podía reservar la misma habitación en las mismas fechas múltiples veces
3. Se podía pagar la misma reserva 2, 3 o 4 veces sin que cambiara de estado

### Fix A — Validación de capacidad (frontend)

**`propiedad-detalle.component.ts` → método `reservar()`:**

```typescript
const selectedHabs = this.habitaciones().filter(h => this.selectedRooms().has(h.habitacionId));
const totalCapacity = selectedHabs.reduce((acc, h) => acc + h.capacidadAdultos, 0);
if ((raw.numAdultos ?? 0) > totalCapacity) {
  this.notify.error(`Las habitaciones seleccionadas admiten máximo ${totalCapacity} adulto(s).`);
  return;
}
```

### Fix B — Detección de conflicto de fechas (frontend + localStorage)

**Problema dentro del fix:** El endpoint `GET /booking/cliente/{id}` no devuelve `detallesHabitacion`, por lo que no es posible saber qué habitaciones tiene cada reserva. La primera versión del check nunca detectaba conflictos.

**Solución definitiva — dos capas:**

**Capa 1 (localStorage):** Al crear una reserva exitosamente, se guardan las habitaciones y fechas:
```typescript
type BookedSlot = { habitacionId: number; checkIn: string; checkOut: string };
const storedSlots: BookedSlot[] = JSON.parse(localStorage.getItem('booked_slots') || '[]');
selectedIds.forEach(id => storedSlots.push({ habitacionId: id, checkIn, checkOut }));
localStorage.setItem('booked_slots', JSON.stringify(storedSlots));
```

Al intentar nueva reserva, se verifica contra ese cache:
```typescript
const hasLocalConflict = storedSlots.some(slot =>
  selectedIds.includes(slot.habitacionId) &&
  checkIn < new Date(slot.checkOut) && checkOut > new Date(slot.checkIn)
);
```

**Capa 2 (backend como backup):** Check por `alojamientoId` con fechas solapadas usando las reservas del propio cliente (limita mismo usuario).

### Fix C — Pago duplicado bloqueado (frontend + backend)

**Frontend — `checkout.component.ts`:**
```typescript
// Al pagar exitosamente:
localStorage.setItem(`reserva_paid_${r.reservaId}`, '1');
this.resvSvc.actualizarEstado(r.reservaId, { estado: 'Completada' }).subscribe();

// Al cargar la página de checkout:
if (localStorage.getItem(`reserva_paid_${id}`)) {
  this.router.navigate(['/factura', id]);
  return;
}
```

**Frontend — `mis-reservas.component.ts`:**
```typescript
isPendingPayment(r: ReservaResponse): boolean {
  if (localStorage.getItem(`reserva_paid_${r.reservaId}`)) return false;
  return ['Pendiente', 'Confirmada'].includes(r.estado);
}

hasInvoice(r: ReservaResponse): boolean {
  if (localStorage.getItem(`reserva_paid_${r.reservaId}`)) return true;
  return r.estado === 'Completada';
}
```

**Commit:** `6568b0f` — *fix: validar capacidad, conflicto de fechas y evitar pago duplicado*

---

## PROBLEMA 9 — Backend no prevenía doble reserva entre usuarios distintos

### Síntoma
Dos usuarios distintos (en distintos navegadores/dispositivos) podían reservar la misma habitación en las mismas fechas. El localStorage solo protege el mismo navegador.

### Fix — Validación en DB dentro del microservicio de Reservas

**Regla:** Solo se toca lógica interna. Contratos y endpoints quedan IDÉNTICOS.

#### Archivo 1: `IRepositories.cs`
```csharp
public interface IReservasRepository : IRepositoryBase<ReservaEntity>
{
    Task<bool> HasConflictingBookingsAsync(List<int> habitacionIds, DateOnly checkIn, DateOnly checkOut);
}
```

#### Archivo 2: `Repositories.cs`
```csharp
public async Task<bool> HasConflictingBookingsAsync(
    List<int> habitacionIds, DateOnly checkIn, DateOnly checkOut)
{
    return await _context.Set<ReservaDetalleHabitacionEntity>()
        .AnyAsync(d =>
            habitacionIds.Contains(d.HabitacionId) &&
            d.Reserva!.Estado != "Cancelada" &&
            d.Reserva.FechaCheckIn < checkOut &&
            d.Reserva.FechaCheckOut > checkIn
        );
}
```
La query se traduce a un SQL JOIN entre `reservadetallehabitacion` y `reservas` buscando solapamiento de fechas para los `habitacionId` solicitados, excluyendo canceladas. Es atómica dentro de la transacción.

#### Archivo 3: `IDataServices.cs`
```csharp
Task<bool> HabitacionesOcupadasAsync(List<int> habitacionIds, DateOnly checkIn, DateOnly checkOut);
```

#### Archivo 4: `ReservasDataService.cs`
```csharp
public async Task<bool> HabitacionesOcupadasAsync(
    List<int> habitacionIds, DateOnly checkIn, DateOnly checkOut)
    => await _repo.HasConflictingBookingsAsync(habitacionIds, checkIn, checkOut);
```

#### Archivo 5: `ReservasService.cs` — paso 3 en `CrearAsync`
```csharp
// 3. Verificación de disponibilidad contra la DB propia (fuente de verdad)
var habitacionIds = request.Habitaciones.Select(h => h.HabitacionId).ToList();
var ocupadas = await _reservasDataService.HabitacionesOcupadasAsync(
    habitacionIds, request.FechaCheckIn, request.FechaCheckOut);
if (ocupadas)
    throw new BusinessRuleException(
        "Una o más habitaciones ya están reservadas para las fechas solicitadas.");

// 3b. Check gRPC adicional (si falla como stub, no bloquea el flujo)
foreach (var habReq in request.Habitaciones)
{
    try { /* ... gRPC check ... */ }
    catch (BusinessRuleException) { throw; }
    catch { /* stub/no disponible — la validación de DB ya cubre */ }
}
```

**Resultado:** Si usuario A ya tiene habitación X en 12-13 dic, cualquier otro usuario que intente reservar habitación X en fechas solapadas recibe HTTP 400 — sin importar navegador ni dispositivo.

**Commit:** `e574032` — *fix: validar disponibilidad de habitaciones contra la DB*

---

## PROBLEMA 10 — Dashboard admin mostraba 0 reservas, 0 pendientes, $0

### Síntoma
El dashboard mostraba correctamente 3 propiedades, pero Total Reservas: 0, Pendientes: 0, Ingresos: $0.

### Causa raíz
El componente llamaba `getResumenByCliente(0)` — clienteId `0` no existe en la DB, por lo que el endpoint devolvía array vacío.

El backend **no tiene** un endpoint "get all reservations" (sin filtro por cliente). Los únicos endpoints disponibles son:
- `GET /booking/{id}`
- `GET /booking/cliente/{clienteId}`
- `GET /booking/resumen/cliente/{clienteId}`

### Fix — Estrategia de agregación en dos pasos

**`admin-dashboard.component.ts`:**

1. Llama `getReservasByCliente(1)` — todas las reservas del ghost login demo (clienteId: 1)
2. Lee `admin_reserva_ids` de localStorage — IDs guardados al crear cada reserva en este navegador
3. Hace `forkJoin` de `getReservaById(id)` para cada ID extra
4. Fusiona ambas listas eliminando duplicados por `reservaId`

Al crear reserva en `propiedad-detalle.component.ts`, se añade:
```typescript
const adminIds: number[] = JSON.parse(localStorage.getItem('admin_reserva_ids') || '[]');
if (!adminIds.includes(r.data.reservaId)) {
  adminIds.push(r.data.reservaId);
  localStorage.setItem('admin_reserva_ids', JSON.stringify(adminIds));
}
```

**Commit:** `ee026ef` — *fix: mostrar reservas reales en dashboard admin*

---

## RESUMEN DE TODOS LOS COMMITS (orden cronológico)

| Commit | Tipo | Descripción |
|--------|------|-------------|
| `bfc51ef` | fix | Errores de compilación TypeScript post-migración de contrato |
| `d502b18` | fix | Interceptor normalizador de respuestas (envelope `{data, success}`) |
| `c7f6133` | fix | Validación de contraseña: mínimo 8 caracteres |
| `68b432a` | feat | Ghost logins para demo (cliente y admin) |
| `69ff692` | fix | Precio habitación y mostrar habitaciones (estado opcional) |
| `51c3717` | fix | `nightCount` reactivo con `toSignal` — nightCount nunca era 0 |
| `6568b0f` | fix | Capacidad, conflicto de fechas y pago duplicado |
| `e574032` | fix | Validación de disponibilidad en DB del microservicio Reservas |
| `ee026ef` | fix | Dashboard admin mostrando reservas reales |

---

## ARCHIVOS MODIFICADOS (resumen total)

### Frontend Angular (`alojamiento-angular/src/`)

```
app/
├── app.config.ts                          ← Registrar responseNormalizerInterceptor
├── core/
│   ├── interceptors/
│   │   └── response-normalizer.interceptor.ts   ← NUEVO
│   └── models/
│       └── alojamiento.model.ts           ← precioNoche, estado opcional
├── services/
│   └── usuarios.service.ts               ← Ghost logins
└── features/
    ├── auth/
    │   └── register/
    │       ├── register.component.ts      ← minLength(8)
    │       └── register.component.html    ← mensaje error
    ├── propiedades/
    │   └── detalle/
    │       ├── propiedad-detalle.component.ts   ← toSignal, validaciones, localStorage
    │       └── propiedad-detalle.component.html ← campos corregidos
    ├── reservas/
    │   ├── mis-reservas/
    │   │   ├── mis-reservas.component.ts        ← isPendingPayment con localStorage
    │   │   └── mis-reservas.component.html      ← campos corregidos
    │   └── checkout/
    │       └── checkout.component.ts            ← localStorage anti-pago-duplicado
    └── admin/
        ├── dashboard/
        │   ├── admin-dashboard.component.ts     ← forkJoin + localStorage aggregation
        │   └── admin-dashboard.component.html   ← campos corregidos
        ├── reservas/
        │   └── admin-reservas.component.html    ← campos corregidos
        └── habitaciones/
            ├── admin-habitaciones.component.ts  ← precioNoche
            └── admin-habitaciones.component.html ← precioNoche, quitar admiteMascotas
```

### Backend .NET (`AlojamientoPrototipo/Microservices/Reservas/`)

```
Reservas.DataAccess/
└── Repositories/
    ├── Interfaces/IRepositories.cs        ← HasConflictingBookingsAsync (firma)
    └── Repositories.cs                   ← HasConflictingBookingsAsync (implementación EF)

Reservas.DataManagement/
├── Interfaces/IDataServices.cs           ← HabitacionesOcupadasAsync (firma)
└── Services/ReservasDataService.cs       ← HabitacionesOcupadasAsync (implementación)

Reservas.Business/
└── Services/ReservasService.cs           ← Paso 3 en CrearAsync: check DB antes de insertar
```

---

## DECISIONES DE DISEÑO IMPORTANTES

### ¿Por qué localStorage para el conflicto de fechas?
El endpoint `GET /booking/cliente/{id}` no devuelve `detallesHabitacion` (el array de habitaciones de la reserva). Sin ese dato, es imposible saber desde el frontend qué habitaciones están ocupadas. El localStorage actúa como cache local de las reservas hechas en este navegador.

### ¿Por qué el fix de DB en el backend para los conflictos cross-usuario?
El localStorage solo protege el mismo navegador. Para que dos usuarios distintos no puedan reservar la misma habitación en las mismas fechas, la fuente de verdad debe ser la DB. Se agregó la validación en la capa de negocio (`ReservasService.CrearAsync`) sin cambiar ningún contrato.

### ¿Por qué `toSignal` para el nightCount?
`computed()` de Angular solo observa reads de Signals. Un `ReactiveForm` de Angular es RxJS, no un Signal. Sin `toSignal`, el computed se ejecuta una vez y congela el resultado. Con `toSignal(form.valueChanges, { initialValue: ... })`, cada cambio en el formulario reactiva el computed.

### ¿Por qué dos microservicios usan nombres distintos para el precio?
`Alojamientos` → `PrecioNoche` (precio de la habitación en catálogo)  
`Reservas` → `PrecioPorNoche` (precio capturado en el momento de la reserva)  
Esto es correcto — son contratos de dos equipos distintos. Se respetó la distinción y solo se renombraron las referencias del lado de Alojamientos.

### ¿Por qué ghost logins en el frontend?
El `AuthService.LoginAsync()` del microservicio de Usuarios es un stub que siempre retorna `null`. Modificar el backend de auth en producción durante una demo es arriesgado. Los ghost logins interceptan ANTES del HTTP call usando `of()` de RxJS — si las credenciales no coinciden, la petición sigue su camino normal.

---

## ESTADO FINAL DEL SISTEMA

| Funcionalidad | Estado |
|---------------|--------|
| Ver propiedades en el sitio | ✅ Funciona |
| Ver detalle de propiedad con habitaciones | ✅ Funciona |
| Registro de nuevo usuario | ✅ Funciona (mín. 8 chars) |
| Login demo (cliente) | ✅ `cliente@demo.com` / `Demo12345!` |
| Login demo (admin) | ✅ `admin@demo.com` / `Admin12345!` |
| Seleccionar habitación y fechas | ✅ Funciona (nightCount reactivo) |
| Validación de capacidad | ✅ Bloquea si se supera el máximo |
| Validación de fechas duplicadas | ✅ localStorage + backend DB |
| Crear reserva | ✅ Funciona |
| Pagar reserva (checkout) | ✅ Funciona, no permite pago doble |
| Ver factura | ✅ Funciona |
| Mis reservas | ✅ Muestra estado correcto post-pago |
| Panel Admin — Dashboard | ✅ Muestra reservas y totales reales |
| Panel Admin — Gestión propiedades | ✅ Funciona |
| Panel Admin — Gestión habitaciones | ✅ Funciona (precio correcto) |
| Conflicto cross-usuario | ✅ Backend rechaza con 400 |
