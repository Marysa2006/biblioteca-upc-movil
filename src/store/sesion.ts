/**
 * Sesión del usuario: quién es, su rol y su token.
 * Se guarda cifrada en el celular con expo-secure-store, así que sobrevive a cerrar la app.
 *
 * El inicio de sesión real (HU-05) llama a iniciarSesion() con el usuario y el token
 * que devuelva el Backend. Mientras tanto, la pantalla de login usa usuarios de prueba.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { Usuario } from '@/types';

/** En el celular: almacenamiento cifrado. */
const almacenSeguro: StateStorage = {
  getItem: (clave) => SecureStore.getItemAsync(clave),
  setItem: (clave, valor) => SecureStore.setItemAsync(clave, valor),
  removeItem: (clave) => SecureStore.deleteItemAsync(clave),
};

/** En el navegador (solo para probar con `npm run web`): SecureStore no existe en la web. */
const hayLocalStorage = () => typeof localStorage !== 'undefined';
const almacenWeb: StateStorage = {
  getItem: (clave) => (hayLocalStorage() ? localStorage.getItem(clave) : null),
  setItem: (clave, valor) => {
    if (hayLocalStorage()) localStorage.setItem(clave, valor);
  },
  removeItem: (clave) => {
    if (hayLocalStorage()) localStorage.removeItem(clave);
  },
};

const almacen = Platform.OS === 'web' ? almacenWeb : almacenSeguro;

type EstadoSesion = {
  usuario: Usuario | null;
  token: string | null;
  /** true cuando ya se leyó la sesión guardada en el celular. */
  hidratada: boolean;
  iniciarSesion: (usuario: Usuario, token: string) => void;
  cerrarSesion: () => void;
  /** Uso interno: lo llama persist cuando termina de leer la sesión guardada. */
  marcarHidratada: () => void;
};

export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      hidratada: false,
      iniciarSesion: (usuario, token) => set({ usuario, token }),
      cerrarSesion: () => set({ usuario: null, token: null }),
      marcarHidratada: () => set({ hidratada: true }),
    }),
    {
      name: 'sesion-biblioteca-upc',
      storage: createJSONStorage(() => almacen),
      partialize: (estado) => ({ usuario: estado.usuario, token: estado.token }),
      onRehydrateStorage: (estadoInicial) => () => {
        estadoInicial.marcarHidratada();
      },
    },
  ),
);
