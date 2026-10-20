/**
 * Recordatorios locales del celular con expo-notifications (HU-27, CA2 y CA3).
 * En Expo Go para Android funcionan las notificaciones locales; el push remoto no (SDK 53+).
 *
 * - configurarNotificaciones(): el handler (para verlas con la app abierta) y el canal de
 *   Android, sin el cual Android 13+ no muestra el diálogo del permiso.
 * - usePermisoRecordatorios(): el permiso, que se vuelve a revisar al volver a la app (por si
 *   la persona lo activó en los ajustes).
 * - sincronizarRecordatorios(plan): deja programados exactamente los del plan.
 * Qué recordar y cuándo lo deciden las funciones puras de src/utils/recordatorios.ts.
 */
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { PREFIJO_RECORDATORIO, type RecordatorioPlaneado } from '@/utils/recordatorios';

const CANAL = 'recordatorios';
/** El de prueba no empieza por PREFIJO_RECORDATORIO: la sincronización no lo cancela. */
const ID_PRUEBA = 'prueba-de-recordatorio';
export const SEGUNDOS_PRUEBA = 10;

let configurado = false;

/** Una sola vez: mostrar la notificación aunque la app esté abierta. */
export function configurarNotificaciones() {
  if (configurado) return;
  configurado = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function asegurarCanal() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Recordatorios de reservas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/**
 * - por_activar: todavía se puede pedir (nunca se pidió, o Android permite pedirlo otra vez).
 * - bloqueado: ya no se puede pedir; hay que activarlo en los ajustes del celular.
 */
export type EstadoPermiso = 'cargando' | 'por_activar' | 'concedido' | 'bloqueado';

function aEstado(respuesta: Notifications.NotificationPermissionsStatus): EstadoPermiso {
  if (respuesta.granted) return 'concedido';
  return respuesta.canAskAgain ? 'por_activar' : 'bloqueado';
}

/** Lee el permiso actual. Si no se puede leer, se ofrece activarlo: pedir() mostrará el error. */
async function leerPermiso(): Promise<EstadoPermiso> {
  try {
    configurarNotificaciones();
    await asegurarCanal();
    return aEstado(await Notifications.getPermissionsAsync());
  } catch {
    return 'por_activar';
  }
}

export function usePermisoRecordatorios() {
  const [estado, setEstado] = useState<EstadoPermiso>('cargando');

  useEffect(() => {
    let montado = true;
    const revisar = () => {
      leerPermiso().then((leido) => {
        if (montado) setEstado(leido);
      });
    };
    revisar();
    // Al volver a la app, por si la persona activó el permiso en los ajustes.
    const suscripcion = AppState.addEventListener('change', (actual) => {
      if (actual === 'active') revisar();
    });
    return () => {
      montado = false;
      suscripcion.remove();
    };
  }, []);

  /** Pide el permiso; la pantalla explica antes para qué sirve. */
  const pedir = useCallback(async () => {
    configurarNotificaciones();
    await asegurarCanal();
    setEstado(aEstado(await Notifications.requestPermissionsAsync()));
  }, []);

  return { estado, pedir };
}

async function recordatoriosProgramados(): Promise<string[]> {
  const todos = await Notifications.getAllScheduledNotificationsAsync();
  return todos
    .map((notificacion) => notificacion.identifier)
    .filter((id) => id.startsWith(PREFIJO_RECORDATORIO));
}

/**
 * Deja programados exactamente los recordatorios del plan: cancela los anteriores y programa
 * de nuevo (si una reserva cambió de hora, su recordatorio también cambia). Devuelve cuántos
 * quedaron. Si algo falla, lanza el error para registrarlo y reintentar (CA3).
 */
export async function sincronizarRecordatorios(plan: RecordatorioPlaneado[]): Promise<number> {
  configurarNotificaciones();
  await asegurarCanal();
  const anteriores = await recordatoriosProgramados();
  await Promise.all(anteriores.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await Promise.all(
    plan.map((recordatorio) =>
      Notifications.scheduleNotificationAsync({
        identifier: recordatorio.identificador,
        content: { title: recordatorio.titulo, body: recordatorio.cuerpo },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: recordatorio.cuando,
          channelId: CANAL,
        },
      }),
    ),
  );
  return plan.length;
}

/** Al cerrar sesión: los recordatorios son de cada persona. */
export async function cancelarRecordatorios(): Promise<void> {
  const anteriores = await recordatoriosProgramados();
  await Promise.all(anteriores.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/** Un recordatorio de ejemplo a los pocos segundos, para probar y para la demo (CA2). */
export async function probarRecordatorio(contenido: { titulo: string; cuerpo: string }) {
  configurarNotificaciones();
  await asegurarCanal();
  await Notifications.scheduleNotificationAsync({
    identifier: ID_PRUEBA,
    content: { title: contenido.titulo, body: contenido.cuerpo },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: Date.now() + SEGUNDOS_PRUEBA * 1000,
      channelId: CANAL,
    },
  });
}

