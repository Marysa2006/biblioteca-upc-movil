/**
 * Abre el tutorial la primera vez que se usa la app en este celular. No muestra nada.
 * - Con una sesión del personal, el del personal (#267), que señala su vista; si no, el de la
 *   comunidad (#261). Cada uno se marca como visto aparte, así que quien es del personal puede
 *   ver los dos.
 *
 * Espera a que:
 * - la navegación esté lista (antes, navegar falla);
 * - se hayan leído las preferencias y la sesión guardadas;
 * - si hay una sesión sin la autorización de datos vigente, se acepte primero (#225): así el
 *   tutorial nunca queda debajo de la autorización.
 * Cada tutorial se abre una sola vez por arranque, aunque la persona lo deje a medias.
 */
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

import { usePreferencias } from '@/store/preferencias';
import { useSesion } from '@/store/sesion';
import { aceptoPoliticaVigente } from '@/utils/privacidad';
import { esPersonal } from '@/utils/roles';

type Vista = 'comunidad' | 'personal';

export function AbrirTutorial() {
  const navegacion = useRootNavigationState();
  const tutorialVisto = usePreferencias((estado) => estado.tutorialVisto);
  const tutorialPersonalVisto = usePreferencias((estado) => estado.tutorialPersonalVisto);
  const preferenciasLeidas = usePreferencias((estado) => estado.hidratada);
  const sesionLeida = useSesion((estado) => estado.hidratada);
  const usuario = useSesion((estado) => estado.usuario);
  const aceptaciones = useSesion((estado) => estado.aceptaciones);
  const yaAbiertos = useRef(new Set<Vista>());

  const vista: Vista = usuario != null && esPersonal(usuario) ? 'personal' : 'comunidad';
  const visto = vista === 'personal' ? tutorialPersonalVisto : tutorialVisto;
  const autorizacionPendiente = usuario != null && !aceptoPoliticaVigente(aceptaciones, usuario.id);
  const toca =
    navegacion?.key != null &&
    preferenciasLeidas &&
    sesionLeida &&
    !visto &&
    !autorizacionPendiente;

  useEffect(() => {
    if (!toca || yaAbiertos.current.has(vista)) return;
    yaAbiertos.current.add(vista);
    if (vista === 'personal') {
      router.push({ pathname: '/tutorial', params: { vista: 'personal' } });
    } else {
      router.push('/tutorial');
    }
  }, [toca, vista]);

  return null;
}
