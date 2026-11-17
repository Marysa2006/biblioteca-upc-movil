/**
 * Abre el tutorial (#261) la primera vez que se usa la app en este celular. No muestra nada.
 *
 * Espera a que:
 * - la navegación esté lista (antes, navegar falla);
 * - se hayan leído las preferencias y la sesión guardadas;
 * - si hay una sesión sin la autorización de datos vigente, se acepte primero (#225): así el
 *   tutorial nunca queda debajo de la autorización.
 * Se abre una sola vez por arranque, aunque la persona lo deje a medias.
 */
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

import { usePreferencias } from '@/store/preferencias';
import { useSesion } from '@/store/sesion';
import { aceptoPoliticaVigente } from '@/utils/privacidad';

export function AbrirTutorial() {
  const navegacion = useRootNavigationState();
  const tutorialVisto = usePreferencias((estado) => estado.tutorialVisto);
  const preferenciasLeidas = usePreferencias((estado) => estado.hidratada);
  const sesionLeida = useSesion((estado) => estado.hidratada);
  const usuario = useSesion((estado) => estado.usuario);
  const aceptaciones = useSesion((estado) => estado.aceptaciones);
  const yaAbierto = useRef(false);

  const autorizacionPendiente = usuario != null && !aceptoPoliticaVigente(aceptaciones, usuario.id);
  const toca =
    navegacion?.key != null &&
    preferenciasLeidas &&
    sesionLeida &&
    !tutorialVisto &&
    !autorizacionPendiente;

  useEffect(() => {
    if (!toca || yaAbierto.current) return;
    yaAbierto.current = true;
    router.push('/tutorial');
  }, [toca]);

  return null;
}
