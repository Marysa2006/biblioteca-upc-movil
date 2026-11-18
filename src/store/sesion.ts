/**
 * Sesión del usuario: quién es, su rol y su token.
 * Se guarda cifrada en el celular con expo-secure-store, así que sobrevive a cerrar la app.
 *
 * También guarda qué autorización de tratamiento de datos aceptó cada persona (#225), con la
 * versión de la política y la fecha. Se guarda por usuario y no se borra al cerrar sesión: quien
 * ya aceptó el Acuerdo 019 no la vuelve a ver, y otra cuenta en el mismo celular sí la ve.
 *
 * El inicio de sesión real (HU-05) llama a iniciarSesion() con el usuario y el token
 * que devuelva el Backend. Mientras tanto, la pantalla de login usa usuarios de prueba.
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
  /** id del usuario → autorización de tratamiento de datos que aceptó (#225). */
  aceptaciones: Aceptaciones;
  /** true cuando ya se leyó la sesión guardada en el celular. */
  hidratada: boolean;
  iniciarSesion: (usuario: Usuario, token: string) => void;
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
      aceptaciones: {},
      hidratada: false,
      iniciarSesion: (usuario, token) => set({ usuario, token }),
      cerrarSesion: () => set({ usuario: null, token: null }),
      aceptarTratamientoDatos: () => {
        const { usuario, aceptaciones } = get();
        if (!usuario) return;
        set({ aceptaciones: { ...aceptaciones, [usuario.id]: nuevaAceptacion() } });
      },
      marcarHidratada: () => set({ hidratada: true }),
    }),
    {
      name: 'sesion-biblioteca-upc',
      storage: createJSONStorage(() => almacen),
      partialize: (estado) => ({
        usuario: estado.usuario,
        token: estado.token,
        aceptaciones: estado.aceptaciones,
      }),
      // Versión 1: el usuario pasó de un solo `rol` a `tipo` + `rolesPersonal` (cierre de la iteración 1).
      // Versión 2: ya no existe el rol `encargado_tablets` (#200).
      // Versión 3: se guarda la autorización de tratamiento de datos (#225). La sesión de la
      // versión 2 se conserva —el usuario ya tiene la forma actual—, pero al abrir la app se pide
      // la aceptación antes de usar nada con cuenta: la autorización tiene que ser previa.
      version: 3,
      migrate: (guardado, versionGuardada) => migrarSesionGuardada(guardado, versionGuardada),
      onRehydrateStorage: (estadoInicial) => () => {
        estadoInicial.marcarHidratada();
      },
    },
  ),
);
