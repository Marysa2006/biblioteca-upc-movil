/**
 * Dónde guardan los stores lo que tiene que sobrevivir a cerrar la app (la sesión y las
 * preferencias del celular). Un solo lugar, para que todos guarden igual.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

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

export const almacen: StateStorage = Platform.OS === 'web' ? almacenWeb : almacenSeguro;
