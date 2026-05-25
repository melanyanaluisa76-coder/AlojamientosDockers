export interface PropiedadItem {
  alojamientoId: number;
  socioId?: number;
  tipoAlojamientoId?: number;
  tipoAlojamientoNombre?: string;
  nombre: string;
  ciudad?: string;
  direccion?: string;
  descripcion?: string;
  estrellas?: number;
  calificacionPromedio?: number;
  totalResenas?: number;
  admiteMascotas: boolean;
  tienePiscina?: boolean;
  tieneParqueadero?: boolean;
  estado?: string;
  fechaCreacion?: string;
}

export interface HabitacionItem {
  habitacionId: number;
  alojamientoId: number;
  nombre: string;
  descripcion?: string;
  precioNoche: number;
  capacidadAdultos: number;
  capacidadNinos: number;
  numDormitorios: number;
  numBanos: number;
  tieneCocina: boolean;
  tieneAireAcondicionado: boolean;
  superficieM2?: number;
  estado?: string;
}

export interface CrearAlojamientoRequest {
  socioId: number;
  tipoAlojamientoId: number;
  nombre: string;
  ciudad?: string;
  direccion: string;
  descripcion?: string;
  admiteMascotas?: boolean;
  tienePiscina?: boolean;
  tieneParqueadero?: boolean;
}

export interface CrearHabitacionRequest {
  alojamientoId: number;
  nombre: string;
  descripcion?: string;
  precioNoche: number;
  capacidadAdultos: number;
  capacidadNinos?: number;
  numDormitorios?: number;
  numBanos?: number;
  tieneCocina?: boolean;
  tieneAireAcondicionado?: boolean;
  superficieM2?: number | null;
}
