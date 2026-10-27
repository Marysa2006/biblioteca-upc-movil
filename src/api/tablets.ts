/**
 * Inventario de tablets (HU-21) y entrega/devolución de préstamos (HU-23).
 * Lista, crea, edita y cambia el estado operativo; entrega y recibe los equipos.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type {
  CondicionTablet,
  EstadoPrestamo,
  EstadoTablet,
  Prestamo,
  RegistroTablet,
  Tablet,
} from '@/types';
import {
  ahoraFechaHora,
  estadoTabletAlDevolver,
  estadoTabletAlEntregar,
  minutosDeRetraso,
} from '@/utils/tablets';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { PRESTAMOS_TABLET, TABLETS } from './mocks/tablets';

/** Copias mutables: con mocks, lo que se crea, edita o presta se ve durante la sesión. */
let tablets: Tablet[] = TABLETS.map((tablet) => ({ ...tablet }));
let prestamos: Prestamo[] = PRESTAMOS_TABLET.map(copiarPrestamo);

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

// ── HU-23: entrega y devolución de préstamos ───────────────────

const CONDICIONES: readonly CondicionTablet[] = ['bueno', 'regular', 'danado'];

/** Datos de la entrega: condición física y accesorios entregados (CA1). */
export type DatosEntrega = Pick<RegistroTablet, 'condicion' | 'accesorios'>;

/** Datos de la devolución: condición, accesorios y novedades si hay daños o faltantes (CA3). */
export type DatosDevolucion = DatosEntrega & Pick<RegistroTablet, 'novedades'>;

/** Copia profunda de un préstamo para no exponer el almacén mutable. */
function copiarPrestamo(prestamo: Prestamo): Prestamo {
  return {
    ...prestamo,
    entrega: prestamo.entrega
      ? { ...prestamo.entrega, accesorios: [...prestamo.entrega.accesorios] }
      : undefined,
    devolucion: prestamo.devolucion
      ? { ...prestamo.devolucion, accesorios: [...prestamo.devolucion.accesorios] }
      : undefined,
  };
}

/** Validación de la condición y los accesorios de un registro (HU-23). */
function errorDeRegistro(datos: DatosEntrega): ErrorApi | null {
  if (!CONDICIONES.includes(datos.condicion)) {
    return new ErrorApi(400, 'La condición del equipo no es válida.');
  }
  if (datos.accesorios.some((accesorio) => !accesorio.trim())) {
    return new ErrorApi(400, 'Los accesorios no pueden estar vacíos.');
  }
  return null;
}

/** Préstamos, opcionalmente filtrados por estado (HU-23). */
export function obtenerPrestamos(
  estado: EstadoPrestamo | 'todas' = 'todas',
): Promise<Prestamo[]> {
  if (USAR_MOCKS) {
    const filtrados =
      estado === 'todas' ? prestamos : prestamos.filter((prestamo) => prestamo.estado === estado);
    return simularRed(filtrados.map(copiarPrestamo));
  }
  const consulta = estado === 'todas' ? '' : `?estado=${estado}`;
  return peticion<Prestamo[]>(`/prestamos/${consulta}`);
}

/**
 * Registra la entrega de un préstamo reservado (CA1): guarda fecha, hora, condición y
 * accesorios, y deja la tablet en préstamo.
 */
export function registrarEntrega(prestamoId: string, datos: DatosEntrega): Promise<Prestamo> {
  if (USAR_MOCKS) {
    const prestamo = prestamos.find((actual) => actual.id === prestamoId);
    if (!prestamo) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    if (prestamo.estado !== 'reservado') {
      return Promise.reject(new ErrorApi(400, 'Solo se puede entregar un préstamo reservado.'));
    }
    if (!prestamo.condicionesAceptadas) {
      return Promise.reject(
        new ErrorApi(400, 'El préstamo no tiene las condiciones de uso aceptadas.'),
      );
    }
    const error = errorDeRegistro(datos);
    if (error) {
      return Promise.reject(error);
    }
    const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
    if (!tablet) {
      return Promise.reject(new ErrorApi(404, 'La tablet del préstamo no existe.'));
    }
    if (tablet.estado !== 'disponible') {
      return Promise.reject(new ErrorApi(400, 'La tablet no está disponible para entregar.'));
    }
    const entrega: RegistroTablet = {
      fechaHora: ahoraFechaHora(),
      condicion: datos.condicion,
      accesorios: datos.accesorios.map((accesorio) => accesorio.trim()),
    };
    prestamos = prestamos.map((actual) =>
      actual.id === prestamoId ? { ...actual, estado: 'entregado', entrega } : actual,
    );
    tablets = tablets.map((actual) =>
      actual.id === tablet.id ? { ...actual, estado: estadoTabletAlEntregar() } : actual,
    );
    const actualizado = prestamos.find((actual) => actual.id === prestamoId);
    if (!actualizado) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    return simularRed(copiarPrestamo(actualizado));
  }
  return peticion<Prestamo>(`/prestamos/${prestamoId}/entrega/`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Registra la devolución de un préstamo entregado o vencido (CA2): cierra el préstamo,
 * guarda la novedad si hay daños o faltantes (CA3), marca el retraso (CA4) y deja la
 * tablet disponible o en mantenimiento si se dañó.
 */
export function registrarDevolucion(
  prestamoId: string,
  datos: DatosDevolucion,
): Promise<Prestamo> {
  if (USAR_MOCKS) {
    const prestamo = prestamos.find((actual) => actual.id === prestamoId);
    if (!prestamo) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    if (prestamo.estado !== 'entregado' && prestamo.estado !== 'vencido') {
      return Promise.reject(new ErrorApi(400, 'Solo se puede devolver un préstamo entregado.'));
    }
    if (!prestamo.entrega) {
      return Promise.reject(new ErrorApi(400, 'El préstamo no tiene una entrega registrada.'));
    }
    const error = errorDeRegistro(datos);
    if (error) {
      return Promise.reject(error);
    }
    const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
    if (!tablet) {
      return Promise.reject(new ErrorApi(404, 'La tablet del préstamo no existe.'));
    }
    const entregados = new Set(prestamo.entrega.accesorios.map((accesorio) => accesorio.trim()));
    const devueltos = new Set(datos.accesorios.map((accesorio) => accesorio.trim()));
    const faltantes = [...entregados].filter((accesorio) => !devueltos.has(accesorio));
    const novedades = datos.novedades?.trim() ?? '';
    if ((datos.condicion === 'danado' || faltantes.length > 0) && !novedades) {
      return Promise.reject(
        new ErrorApi(400, 'Describe la novedad: hay daños o accesorios faltantes.'),
      );
    }
    const retrasoMinutos = minutosDeRetraso(prestamo);
    const devolucion: RegistroTablet = {
      fechaHora: ahoraFechaHora(),
      condicion: datos.condicion,
      accesorios: [...devueltos],
      ...(novedades ? { novedades } : {}),
      tardia: retrasoMinutos > 0,
      retrasoMinutos,
    };
    prestamos = prestamos.map((actual) =>
      actual.id === prestamoId ? { ...actual, estado: 'devuelto', devolucion } : actual,
    );
    tablets = tablets.map((actual) =>
      actual.id === tablet.id
        ? { ...actual, estado: estadoTabletAlDevolver(datos.condicion) }
        : actual,
    );
    const actualizado = prestamos.find((actual) => actual.id === prestamoId);
    if (!actualizado) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    return simularRed(copiarPrestamo(actualizado));
  }
  return peticion<Prestamo>(`/prestamos/${prestamoId}/devolucion/`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}
