/**
 * Notificaciones y recordatorios (HU-27).
 *
 * Aquí vive el almacén de notificaciones de los datos de prueba y el creador que usan
 * las demás capas de datos (HU-18, HU-19 y HU-20) cuando una solicitud cambia de estado.
 * HU-27 (#56) agrega la consulta y el "marcar leída" sobre este mismo almacén.
 *
 * Con la API real el aviso lo crea el Backend; por eso crearNotificacion() solo se usa
 * con datos de prueba.
 */
import type { Notificacion } from '@/types';

import { NOTIFICACIONES } from './mocks/notificaciones';

/** Copia mutable: con mocks, los avisos creados se ven durante la sesión de la app. */
let notificaciones: Notificacion[] = NOTIFICACIONES.map((notificacion) => ({ ...notificacion }));

/** Datos para crear un aviso; el id, la fecha y "leída" los pone el sistema. */
export type DatosNotificacion = Omit<Notificacion, 'id' | 'fecha' | 'leida'> & { fecha?: string };

function ahora(): string {
  const fecha = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())} ${dos(
    fecha.getHours(),
  )}:${dos(fecha.getMinutes())}`;
}

/** Crea un aviso en los datos de prueba (lo usan HU-18, HU-19 y HU-20). */
export function crearNotificacion(datos: DatosNotificacion): Notificacion {
  const nueva: Notificacion = {
    ...datos,
    id: `not-${Date.now()}-${notificaciones.length + 1}`,
    fecha: datos.fecha ?? ahora(),
    leida: false,
  };
  notificaciones = [...notificaciones, nueva];
  return { ...nueva };
}
