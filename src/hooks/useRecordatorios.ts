/**
 * Recordatorios locales del celular con expo-notifications (HU-27, CA2 y CA3).
 * En Expo Go para Android funcionan las notificaciones locales; el push remoto no (SDK 53+).
 *
 * - configurarNotificaciones(): el handler (para verlas con la app abierta) y el canal de
 *   Android, sin el cual Android 13+ no muestra el diálogo del permiso. En Expo Go no se crea:
 *   Expo Go no deja crear canales (falla con NullPointerException) y usa el suyo, "Project
 *   notifications".
 * - usePermisoRecordatorios(): el permiso, compartido en el store de recordatorios; se vuelve a
 *   revisar al volver a la app (por si la persona lo activó en los ajustes).
 * - sincronizarRecordatorios(plan): deja programados exactamente los del plan.
 * Qué recordar y cuándo lo deciden las funciones puras de src/utils/recordatorios.ts.
 */
/*
 * Las funciones se importan desde sus archivos dentro del paquete y no con
 * `import * as Notifications from 'expo-notifications'`: el archivo principal del paquete
 * también carga la suscripción a temas de push, que exige el módulo nativo
 * ExpoTopicSubscriptionModule, y Expo Go para Android no lo trae (la app se caía al abrir).
 * Estos archivos solo usan los módulos de notificaciones locales. Con la development build
 * (iteración 3) se puede volver al import del paquete. Si otra pantalla necesita
 * notificaciones, que use este archivo.
 */
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import type { NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { isRunningInExpoGo } from 'expo';
import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useEstadoRecordatorios, type EstadoPermiso } from '@/store/recordatorios';
import { PREFIJO_RECORDATORIO, type RecordatorioPlaneado } from '@/utils/recordatorios';

export type { EstadoPermiso };

const CANAL = 'recordatorios';
/** En Expo Go no se pueden crear canales: las notificaciones van al canal de Expo Go. */
const CANAL_PROPIO = Platform.OS === 'android' && !isRunningInExpoGo();
/** El canal del trigger: el nuestro fuera de Expo Go; en Expo Go, el que ponga el sistema. */
const canalDelTrigger = CANAL_PROPIO ? { channelId: CANAL } : {};
/** El de prueba no empieza por PREFIJO_RECORDATORIO: la sincronización no lo cancela. */
const ID_PRUEBA = 'prueba-de-recordatorio';
export const SEGUNDOS_PRUEBA = 10;

let configurado = false;

/** Una sola vez: mostrar la notificación aunque la app esté abierta. */
export function configurarNotificaciones() {
  if (configurado) return;
  configurado = true;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function asegurarCanal() {
  if (CANAL_PROPIO) {
    await setNotificationChannelAsync(CANAL, {
      name: 'Recordatorios de reservas',
      importance: AndroidImportance.HIGH,
    });
  }
}


function aEstado(respuesta: NotificationPermissionsStatus): EstadoPermiso {
  if (respuesta.granted) return 'concedido';
  return respuesta.canAskAgain ? 'por_activar' : 'bloqueado';
}

/** Lee el permiso actual. Si no se puede leer, se ofrece activarlo: pedir() mostrará el error. */
async function leerPermiso(): Promise<EstadoPermiso> {
  try {
    configurarNotificaciones();
    await asegurarCanal();
    return aEstado(await getPermissionsAsync());
  } catch (error) {
    console.warn('[recordatorios] No se pudo leer el permiso de notificaciones', error);
    return 'por_activar';
  }
}

export function usePermisoRecordatorios() {
  const estado = useEstadoRecordatorios((actual) => actual.permiso);
  const registrarPermiso = useEstadoRecordatorios((actual) => actual.registrarPermiso);

  useEffect(() => {
    let montado = true;
    const revisar = () => {
      leerPermiso().then((leido) => {
        if (montado) registrarPermiso(leido);
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
  }, [registrarPermiso]);

  /** Pide el permiso; la pantalla explica antes para qué sirve. */
  const pedir = useCallback(async () => {
    configurarNotificaciones();
    await asegurarCanal();
    // Con android explícito: sin él, el paquete le pasa undefined al módulo nativo en Android.
    const respuesta = await requestPermissionsAsync({
      android: {},
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    registrarPermiso(aEstado(respuesta));
  }, [registrarPermiso]);

  return { estado, pedir };
}

async function recordatoriosProgramados(): Promise<string[]> {
  const todos = await getAllScheduledNotificationsAsync();
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
  await Promise.all(anteriores.map((id) => cancelScheduledNotificationAsync(id)));
  await Promise.all(
    plan.map((recordatorio) =>
      scheduleNotificationAsync({
        identifier: recordatorio.identificador,
        content: { title: recordatorio.titulo, body: recordatorio.cuerpo },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: recordatorio.cuando,
          ...canalDelTrigger,
        },
      }),
    ),
  );
  return plan.length;
}

/** Al cerrar sesión: los recordatorios son de cada persona. */
export async function cancelarRecordatorios(): Promise<void> {
  const anteriores = await recordatoriosProgramados();
  await Promise.all(anteriores.map((id) => cancelScheduledNotificationAsync(id)));
}

/** Un recordatorio de ejemplo a los pocos segundos, para probar y para la demo (CA2). */
export async function probarRecordatorio(contenido: { titulo: string; cuerpo: string }) {
  configurarNotificaciones();
  await asegurarCanal();
  await scheduleNotificationAsync({
    identifier: ID_PRUEBA,
    content: { title: contenido.titulo, body: contenido.cuerpo },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: Date.now() + SEGUNDOS_PRUEBA * 1000,
      ...canalDelTrigger,
    },
  });
}

