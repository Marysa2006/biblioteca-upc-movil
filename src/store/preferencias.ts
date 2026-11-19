/**
 * Preferencias del celular, que no dependen de la cuenta: hoy, si ya se vio el tutorial de la
 * comunidad (#261) y el del personal (#267), cada uno aparte. Se guardan aparte de la sesión, así que cerrar sesión o cambiar de
 * cuenta no las borra, y cambiarlas nunca toca la sesión guardada.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacen } from './almacen';

type EstadoPreferencias = {
  /** true cuando la persona terminó o saltó el tutorial en este celular. */
  tutorialVisto: boolean;
  /** true cuando alguien del personal terminó o saltó su tutorial en este celular (#267). */
  tutorialPersonalVisto: boolean;
  /** true cuando ya se leyó lo guardado en el celular. */
  hidratada: boolean;
  marcarTutorialVisto: () => void;
  marcarTutorialPersonalVisto: () => void;
  /** Uso interno: lo llama persist cuando termina de leer lo guardado. */
  marcarHidratada: () => void;
};

export const usePreferencias = create<EstadoPreferencias>()(
  persist(
    (set) => ({
      tutorialVisto: false,
      tutorialPersonalVisto: false,
      hidratada: false,
      marcarTutorialVisto: () => set({ tutorialVisto: true }),
      marcarTutorialPersonalVisto: () => set({ tutorialPersonalVisto: true }),
      marcarHidratada: () => set({ hidratada: true }),
    }),
    {
      name: 'preferencias-biblioteca-upc',
      storage: createJSONStorage(() => almacen),
      partialize: (estado) => ({
        tutorialVisto: estado.tutorialVisto,
        tutorialPersonalVisto: estado.tutorialPersonalVisto,
      }),
      // Sigue en la versión 1: lo guardado antes no trae tutorialPersonalVisto, y persist lo
      // completa con el valor inicial (false). No hace falta migrar.
      version: 1,
      onRehydrateStorage: (estadoInicial) => () => {
        estadoInicial.marcarHidratada();
      },
    },
  ),
);
