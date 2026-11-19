/**
 * Preferencias del celular, que no dependen de la cuenta: hoy, si ya se vio el tutorial del
 * primer ingreso (#261). Se guardan aparte de la sesión, así que cerrar sesión o cambiar de
 * cuenta no las borra, y cambiarlas nunca toca la sesión guardada.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacen } from './almacen';

type EstadoPreferencias = {
  /** true cuando la persona terminó o saltó el tutorial en este celular. */
  tutorialVisto: boolean;
  /** true cuando ya se leyó lo guardado en el celular. */
  hidratada: boolean;
  marcarTutorialVisto: () => void;
  /** Uso interno: lo llama persist cuando termina de leer lo guardado. */
  marcarHidratada: () => void;
};

export const usePreferencias = create<EstadoPreferencias>()(
  persist(
    (set) => ({
      tutorialVisto: false,
      hidratada: false,
      marcarTutorialVisto: () => set({ tutorialVisto: true }),
      marcarHidratada: () => set({ hidratada: true }),
    }),
    {
      name: 'preferencias-biblioteca-upc',
      storage: createJSONStorage(() => almacen),
      partialize: (estado) => ({ tutorialVisto: estado.tutorialVisto }),
      version: 1,
      onRehydrateStorage: (estadoInicial) => () => {
        estadoInicial.marcarHidratada();
      },
    },
  ),
);
