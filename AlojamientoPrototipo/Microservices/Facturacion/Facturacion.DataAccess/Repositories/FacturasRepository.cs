using Facturacion.DataAccess.Common;
using Facturacion.DataAccess.Contexts;
using Facturacion.DataAccess.Entities;
using Facturacion.DataAccess.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Facturacion.DataAccess.Repositories;

public class FacturasRepository : RepositoryBase<FacturaEntity>, IFacturasRepository
{
    public FacturasRepository(FacturacionDbContext context) : base(context) { }

    public override async Task<IEnumerable<FacturaEntity>> GetAllAsync()
        => await _dbSet
            .Include(f => f.MetodoPago)
            .Include(f => f.Detalles)
            .OrderByDescending(f => f.FechaCreacion)
            .ToListAsync();

    public override async Task<FacturaEntity?> GetByIdAsync(int id)
        => await _dbSet
            .Include(f => f.MetodoPago)
            .Include(f => f.Detalles)
            .FirstOrDefaultAsync(f => f.FacturaId == id);
}
