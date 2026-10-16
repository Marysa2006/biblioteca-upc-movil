/**
 * Servicios de la biblioteca (HU-01 y HU-04).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

export type CategoriaServicio =
  | 'asesorias'
  | 'capacitaciones'
  | 'espacios'
  | 'tablets'
  | 'repositorio'
  | 'prestamo';

/** Servicio de la biblioteca (HU-01). */
export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaServicio;
  publico: string;
  formaSolicitud: string;
  horario: string;
  requiereCuenta: boolean;
  activo: boolean;
};
