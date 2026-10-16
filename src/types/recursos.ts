/**
 * Recursos académicos externos (HU-03).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

/** Base de datos o recurso académico externo (HU-03). */
export type Recurso = {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  requiereCuenta: boolean;
};
