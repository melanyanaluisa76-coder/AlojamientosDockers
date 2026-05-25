using Microsoft.EntityFrameworkCore;
using Reservas.DataAccess.Common;
using Reservas.DataAccess.Contexts;
using Reservas.DataAccess.Entities;
using Reservas.DataAccess.Repositories.Interfaces;

namespace Reservas.DataAccess.Repositories;

public class ReservasRepository : RepositoryBase<ReservaEntity>, IReservasRepository
{
    public ReservasRepository(ReservasDbContext context) : base(context) { }

    public async Task<bool> HasConflictingBookingsAsync(List<int> habitacionIds, DateOnly checkIn, DateOnly checkOut)
    {
        return await _context.Set<ReservaDetalleHabitacionEntity>()
            .AnyAsync(d =>
                habitacionIds.Contains(d.HabitacionId) &&
                d.Reserva!.Estado != "Cancelada" &&
                d.Reserva.FechaCheckIn < checkOut &&
                d.Reserva.FechaCheckOut > checkIn
            );
    }
}

public class DescuentosRepository : RepositoryBase<DescuentoEntity>, IDescuentosRepository
{
    public DescuentosRepository(ReservasDbContext context) : base(context) { }
}

public class ReservaDetallesRepository : RepositoryBase<ReservaDetalleHabitacionEntity>, IReservaDetallesRepository
{
    public ReservaDetallesRepository(ReservasDbContext context) : base(context) { }
}
