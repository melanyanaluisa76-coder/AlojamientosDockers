export interface PropiedadItem {
  propiedadId: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  estrellas: number;
  calificacionPromedio?: number;
  totalResenas?: number;
  admiteMascotas: boolean;
  estado?: string;
  tipoAlojamiento?: string;
  colaboradorId?: number;
}

export interface HabitacionItem {
  habitacionId: number;
  propiedadId: number;
  nombre: string;
  descripcion?: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  numBanos: number;
  numDormitorios: number;
  superficieM2?: number;
  admiteMascotas: boolean;
  tieneCocina: boolean;
  tieneAireAcondicionado: boolean;
  estado: boolean;
  precioPorNoche?: number;
}

export interface CrearPropiedadRequest {
  nombre: string;
  descripcion: string;
  direccion: string;
  ciudadId: number;
  tipoAlojamientoId: number;
  estrellas: number;
  admiteMascotas: boolean;
  colaboradorId: number;
}

export interface CrearHabitacionRequest {
  propiedadId: number;
  nombre: string;
  descripcion: string;
  capacidadAdultos: number;
  capacidadNinos: number;
  numBanos: number;
  numDormitorios: number;
  superficieM2?: number | null;
  admiteMascotas: boolean;
  tieneCocina: boolean;
  tieneAireAcondicionado: boolean;
}

export interface Ciudad {
  ciudadId: number;
  nombre: string;
  pais?: string;
}

export interface TipoAlojamiento {
  tipoAlojamientoId: number;
  nombre: string;
}

export interface BuscarPropiedadesParams {
  CiudadId?: number;
  EstrellasMinimas?: number;
  AdmiteMascotas?: boolean;
  FechaCheckIn?: string;
  FechaCheckOut?: string;
  NumAdultos?: number;
  NumNinos?: number;
  PageSize?: number;
  PageNumber?: number;
}
