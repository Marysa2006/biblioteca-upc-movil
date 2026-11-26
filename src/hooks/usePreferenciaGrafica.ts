import { useEffect, useState } from 'react';

import { almacen } from '@/store/almacen';

export type TipoGrafica = 'dona' | 'lineas' | 'barras';

export function usePreferenciaGrafica(clave: string, recomendada: TipoGrafica) {
  const [seleccion, setSeleccion] = useState<{ clave: string; tipo: string | null }>();
  const almacenamiento = 'grafica.' + clave;

  useEffect(() => {
    if (recomendada === 'barras') return;
    let vigente = true;
    async function leer() {
      try {
        const tipo = await almacen.getItem(almacenamiento);
        if (vigente) setSeleccion((actual) => (actual?.clave === clave ? actual : { clave, tipo }));
      } catch {
        // La tarjeta conserva el tipo recomendado cuando el almacenamiento no responde.
      }
    }
    void leer();
    return () => {
      vigente = false;
    };
  }, [almacenamiento, clave, recomendada]);

  async function elegir(tipo: TipoGrafica) {
    setSeleccion({ clave, tipo });
    try {
      await almacen.setItem(almacenamiento, tipo);
    } catch {
      // La selección sigue funcionando en la sesión actual.
    }
  }

  const recordada = seleccion?.clave === clave ? seleccion.tipo : null;
  return { tipo: recordada === 'barras' ? ('barras' as const) : recomendada, elegir };
}
