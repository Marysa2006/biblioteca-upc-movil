/**
 * Cómo lleva el Dashboard (#306) a Gestión y a los detalles. No es una función pura: navega.
 */
import { router } from 'expo-router';

import type { ValorSeccionGestion } from '@/utils/gestion';
import type { Pendiente } from '@/utils/panel';
import type { GrupoPrestamos } from '@/utils/prestamos';

/**
 * Abre Gestión en una sección. `abrir` (la hora del toque) hace que Gestión vuelva a esa sección
 * aunque la persona se haya movido a otra desde la última vez (ver gestion.tsx). Con `grupo`,
 * Préstamos abre en ese grupo, por ejemplo Vencidos (#310).
 */
export function irAGestion(seccion: ValorSeccionGestion, grupo?: GrupoPrestamos) {
  const abrir = String(Date.now());
  router.navigate({
    pathname: '/gestion',
    params: grupo ? { seccion, grupo, abrir } : { seccion, abrir },
  });
}

/**
 * Abre lo pendiente: la cita en su detalle de la Agenda, la capacitación en el suyo, y la reserva
 * en Gestión → Solicitudes (las reservas se deciden en la bandeja; no tienen pantalla propia).
 */
export function abrirPendiente(
  pendiente: Pendiente,
  rangoAgenda: { desde: string; hasta: string },
) {
  if (pendiente.tipo === 'asesoria') {
    router.push({ pathname: '/agenda/[id]', params: { id: pendiente.id, ...rangoAgenda } });
  } else if (pendiente.tipo === 'capacitacion') {
    router.push({ pathname: '/capacitaciones/[id]', params: { id: pendiente.id } });
  } else {
    irAGestion('solicitudes');
  }
}
