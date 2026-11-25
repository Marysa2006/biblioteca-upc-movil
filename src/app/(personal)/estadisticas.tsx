/**
 * Estadísticas (permiso `estadisticas`): el uso de los servicios de la biblioteca.
 * Desde el #307, un solo nivel de pestañas, como el tablero de Análisis de datos:
 * - Resumen, Servicios, Tablets y Calidad: los indicadores (HU-26), en SeccionIndicadores.
 * - Registros: las operaciones con todos sus campos (HU-25), en SeccionRegistros.
 * Encima de todas, BarraEstadisticas: los filtros (que valen para las cinco) y la exportación.
 * La pantalla guarda los filtros y la pestaña; cada sección solo muestra.
 * Al entrar a la pestaña y al deslizar hacia abajo se vuelve a pedir todo lo de estadísticas.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { BarraEstadisticas } from '@/components/estadisticas/BarraEstadisticas';
import {
  SeccionIndicadores,
  type PestanaIndicadores,
} from '@/components/estadisticas/SeccionIndicadores';
import { SeccionRegistros } from '@/components/estadisticas/SeccionRegistros';
import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { usaApi } from '@/api/cliente';
import type { FiltrosEstadisticas } from '@/types';

type ValorSeccion = PestanaIndicadores | 'registros';

const SECCIONES: { valor: ValorSeccion; etiqueta: string }[] = [
  { valor: 'resumen', etiqueta: 'Resumen' },
  { valor: 'servicios', etiqueta: 'Servicios' },
  { valor: 'tablets', etiqueta: 'Tablets' },
  { valor: 'calidad', etiqueta: 'Calidad' },
  { valor: 'registros', etiqueta: 'Registros' },
];

/** Prefijo de las consultas de estadísticas (registros e indicadores). */
const CLAVE_ESTADISTICAS = ['estadisticas'];

export default function Estadisticas() {
  const { tienePermiso } = useRol();
  const queryClient = useQueryClient();
  const [elegida, setElegida] = useState<ValorSeccion>('resumen');
  const [filtros, setFiltros] = useState<FiltrosEstadisticas>({});
  const [recargando, setRecargando] = useState(false);
  const quitarFiltros = () => setFiltros({});

  // La pestaña sigue montada al cambiar de pestaña y la caché dura 5 minutos: al volver, se
  // consulta de nuevo para que aparezcan las operaciones que se hicieron en Gestión.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: CLAVE_ESTADISTICAS });
    }, [queryClient]),
  );

  const recargar = async () => {
    setRecargando(true);
    try {
      await queryClient.refetchQueries({ queryKey: CLAVE_ESTADISTICAS });
    } finally {
      setRecargando(false);
    }
  };

  if (!tienePermiso('estadisticas')) {
    return (
      <Pantalla titulo="Estadísticas" subtitulo="Uso de los servicios de la biblioteca">
        <SinPermiso />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Estadísticas"
      subtitulo="Uso de los servicios de la biblioteca"
      recarga={{ recargando, onRecargar: () => void recargar() }}
    >
      <SelectorSeccion
        opciones={usaApi('estadisticas') ? SECCIONES.filter(({ valor }) => valor !== 'registros') : SECCIONES}
        valor={elegida}
        onCambiar={setElegida}
        etiqueta="Secciones de Estadísticas"
      />

      <BarraEstadisticas filtros={filtros} onCambiar={setFiltros} />

      {elegida === 'registros' ? (
        <SeccionRegistros filtros={filtros} onQuitarFiltros={quitarFiltros} />
      ) : (
        <SeccionIndicadores filtros={filtros} pestana={elegida} onQuitarFiltros={quitarFiltros} />
      )}
    </Pantalla>
  );
}
