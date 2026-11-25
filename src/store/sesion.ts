/**
 * Sesión del usuario: quién es, su rol y su token.
 * Se guarda cifrada en el celular con expo-secure-store, así que sobrevive a cerrar la app.
 *
 * La autorización de tratamiento de datos (#225) es un dato del usuario (`aceptacionDatos`): se
 * acepta al registrarse. Aquí se guarda además la que se acepta en el celular cuando la
 * Universidad publica otra política, por usuario y sin borrarla al cerrar sesión.
 *
 * Con la API real (HU-05), iniciarSesion() recibe el `access` (`token`, dura 30 minutos) y el
 * `refresh` (7 días) del Backend. `peticion()` renueva el `access` con el `refresh` cuando vence, y
 * guarda los dos con actualizarTokens(), porque el Backend también cambia el `refresh`. Con datos de
 * prueba, `refresh` queda en null.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Usuario } from '@/types';
import {
  type Aceptaciones,
  migrarSesionGuardada,
  nuevaAceptacion,
} from '@/utils/privacidad';

import { almacen } from './almacen';

type EstadoSesion = {
  usuario: Usuario | null;
  token: string | null;
  /** Para pedir otro `token` al Backend cuando vence; null con datos de prueba. */
  refresh: string | null;
  /** id del usuario → autorización de tratamiento de datos que aceptó (#225). */
  aceptaciones: Aceptaciones;
  /** true cuando ya se leyó la sesión guardada en el celular. */
  hidratada: boolean;
  iniciarSesion: (usuario: Usuario, token: string, refresh?: string | null) => void;
  /** Los tokens nuevos después de renovarlos (src/api/cliente.ts). */
  actualizarTokens: (token: string, refresh: string) => void;
  cerrarSesion: () => void;
  /** Guarda que la persona de la sesión aceptó la política vigente (#225, CA2). */
  aceptarTratamientoDatos: () => void;
  /** Uso interno: lo llama persist cuando termina de leer la sesión guardada. */
  marcarHidratada: () => void;
};

export const useSesion = create<EstadoSesion>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      refresh: null,
      aceptaciones: {},
      hidratada: false,
      iniciarSesion: (usuario, token, refresh = null) => set({ usuario, token, refresh }),
      actualizarTokens: (token, refresh) => set({ token, refresh }),
      cerrarSesion: () => set({ usuario: null, token: null, refresh: null }),
      aceptarTratamientoDatos: () => {
        const { usuario, aceptaciones } = get();
        if (!usuario) return;
        const aceptacion = nuevaAceptacion();
        set({
          aceptaciones: { ...aceptaciones, [usuario.id]: aceptacion },
          usuario: { ...usuario, aceptacionDatos: aceptacion },
        });
      },
      marcarHidratada: () => set({ hidratada: true }),
    }),
    {
      name: 'sesion-biblioteca-upc',
      storage: createJSONStorage(() => almacen),
      partialize: (estado) => ({
        usuario: estado.usuario,
        token: estado.token,
        refresh: estado.refresh,
        aceptaciones: estado.aceptaciones,
      }),
      // Versión 1: el usuario pasó de un solo `rol` a `tipo` + `rolesPersonal` (cierre de la iteración 1).
      // Versión 2: ya no existe el rol `encargado_tablets` (#200).
      // Versión 3: se guarda la autorización de tratamiento de datos (#225). La sesión de la
      // versión 2 se conserva —el usuario ya tiene la forma actual—, pero al abrir la app se pide
      // la aceptación antes de usar nada con cuenta: la autorización tiene que ser previa.
      // Versión 4: se guarda el `refresh` de la API real. La sesión de la versión 3 se conserva
      // sin él.
      version: 4,
      migrate: (guardado, versionGuardada) => migrarSesionGuardada(guardado, versionGuardada),
      onRehydrateStorage: (estadoInicial) => () => {
        estadoInicial.marcarHidratada();
      },
    },
  ),
);
