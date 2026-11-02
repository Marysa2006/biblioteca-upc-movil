/**
 * Pantallas de guías sin conexión (HU-29): estado de cada guía frente a su copia guardada y
 * el texto en bloques para leerlo. Funciones puras, sin hooks.
 */
import type { Guia, GuiaGuardada } from '@/types';

/**
 * Cómo está una guía en el celular: guardada y al día, guardada pero con versión nueva
 * publicada (CA3), o sin guardar (CA4).
 */
export type EstadoGuia = 'guardada' | 'desactualizada' | 'sin_guardar';

export function estadoGuia(guia: Guia, guardadas: GuiaGuardada[]): EstadoGuia {
  const guardada = guardadas.find((g) => g.guia.id === guia.id);
  if (!guardada) return 'sin_guardar';
  return guardada.guia.actualizada < guia.actualizada ? 'desactualizada' : 'guardada';
}

/** Guías publicadas con una versión más nueva que la guardada en el celular (CA3). */
export function guiasDesactualizadas(publicadas: Guia[], guardadas: GuiaGuardada[]): Guia[] {
  return publicadas.filter((guia) => estadoGuia(guia, guardadas) === 'desactualizada');
}

/** Un bloque del texto de una guía: título, párrafo o paso numerado. */
export type BloqueGuia = { tipo: 'titulo' | 'parrafo' | 'paso'; texto: string };

/**
 * Divide el texto plano de una guía en bloques: la primera línea es el título, las que
 * empiezan con "1." son pasos y las demás, párrafos. Las líneas vacías separan.
 */
export function bloquesDeGuia(contenido: string): BloqueGuia[] {
  const lineas = contenido.split('\n').map((linea) => linea.trim()).filter((linea) => linea !== '');
  return lineas.map((texto, indice) => {
    if (indice === 0) return { tipo: 'titulo', texto };
    if (/^\d+[.)]\s/.test(texto)) return { tipo: 'paso', texto };
    return { tipo: 'parrafo', texto };
  });
}
