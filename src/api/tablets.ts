/**
 * Inventario de tablets (HU-21).
 * Lista, crea, edita y cambia el estado operativo. El código y el serial son únicos (CA2).
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { EstadoTablet, Tablet } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { TABLETS } from './mocks/tablets';

/** Copia mutable: con mocks, lo que se crea o edita se ve durante la sesión. */
let tablets: Tablet[] = TABLETS.map((tablet) => ({ ...tablet }));

const ESTADOS: readonly EstadoTablet[] = ['disponible', 'en_prestamo', 'mantenimiento', 'de_baja'];

/** Datos del formulario de una tablet; sin id crea y con id edita. */
export type DatosTablet = Omit<Tablet, 'id'> & { id?: string };

/** Validación de la HU-21: campos obligatorios y código/serial únicos (CA2). */
function errorDeValidacion(datos: DatosTablet): ErrorApi | null {
  if (!datos.codigo?.trim()) {
    return new ErrorApi(400, 'El código interno es obligatorio.');
  }
  if (!datos.serial?.trim()) {
    return new ErrorApi(400, 'El serial es obligatorio.');
  }
  if (!datos.modelo?.trim()) {
    return new ErrorApi(400, 'El modelo es obligatorio.');
  }
  if (!ESTADOS.includes(datos.estado)) {
    return new ErrorApi(400, 'El estado de la tablet no es válido.');
  }
  if (datos.accesorios.some((accesorio) => !accesorio.trim())) {
    return new ErrorApi(400, 'Los accesorios no pueden estar vacíos.');
  }
  const codigo = datos.codigo.trim().toLowerCase();
  const serial = datos.serial.trim().toLowerCase();
  const repetido = tablets.find(
    (tablet) =>
      tablet.id !== datos.id &&
      (tablet.codigo.toLowerCase() === codigo || tablet.serial.toLowerCase() === serial),
  );
  if (repetido) {
    return new ErrorApi(400, 'Ya existe una tablet con ese código o serial.');
  }
  return null;
}

export function obtenerTablets(): Promise<Tablet[]> {
  if (USAR_MOCKS) {
    return simularRed(tablets.map((tablet) => ({ ...tablet })));
  }
  return peticion<Tablet[]>('/tablets/');
}

export function crearTablet(datos: DatosTablet): Promise<Tablet> {
  if (USAR_MOCKS) {
    const error = errorDeValidacion(datos);
    if (error) {
      return Promise.reject(error);
    }
    const nueva: Tablet = {
      ...datos,
      id: `tab-${Date.now()}`,
      codigo: datos.codigo.trim(),
      serial: datos.serial.trim(),
      modelo: datos.modelo.trim(),
    };
    tablets = [...tablets, nueva];
    return simularRed({ ...nueva });
  }
  return peticion<Tablet>('/tablets/', { method: 'POST', body: JSON.stringify(datos) });
}

export function editarTablet(id: string, datos: DatosTablet): Promise<Tablet> {
  if (USAR_MOCKS) {
    const indice = tablets.findIndex((tablet) => tablet.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'La tablet no existe.'));
    }
    const error = errorDeValidacion({ ...datos, id });
    if (error) {
      return Promise.reject(error);
    }
    const actualizada: Tablet = {
      ...datos,
      id,
      codigo: datos.codigo.trim(),
      serial: datos.serial.trim(),
      modelo: datos.modelo.trim(),
    };
    tablets = tablets.map((tablet, i) => (i === indice ? actualizada : tablet));
    return simularRed({ ...actualizada });
  }
  return peticion<Tablet>(`/tablets/${id}/`, { method: 'PUT', body: JSON.stringify(datos) });
}

/** Cambia el estado operativo (CA3): una tablet no operativa deja de estar disponible. */
export function cambiarEstadoTablet(id: string, estado: EstadoTablet): Promise<Tablet> {
  if (USAR_MOCKS) {
    const indice = tablets.findIndex((tablet) => tablet.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'La tablet no existe.'));
    }
    if (!ESTADOS.includes(estado)) {
      return Promise.reject(new ErrorApi(400, 'El estado de la tablet no es válido.'));
    }
    tablets = tablets.map((tablet, i) => (i === indice ? { ...tablet, estado } : tablet));
    return simularRed({ ...tablets[indice] });
  }
  return peticion<Tablet>(`/tablets/${id}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}
