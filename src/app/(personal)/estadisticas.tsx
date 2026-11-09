/**
 * Estadísticas (permiso `estadisticas`): el uso de los servicios de la biblioteca.
 * - Indicadores: totales y gráficos con filtros, y exportación a CSV (HU-26). Va primero.
 * - Registros: las operaciones registradas con todos sus campos (HU-25).
 * Como en Gestión, cada sección vive en su componente de src/components/estadisticas y el
 * selector aparece solo con dos secciones o más.
 * Al entrar a la pestaña y al deslizar hacia abajo se vuelve a pedir todo lo de estadísticas.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ComponentType } from 'react';

import { SeccionIndicadores } from '@/components/estadisticas/SeccionIndicadores';
import { SeccionRegistros } from '@/components/estadisticas/SeccionRegistros';
import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';

type ValorSeccion = 'indicadores' | 'registros';

type Seccion = {
  valor: ValorSeccion;
  etiqueta: string;
  Componente: ComponentType;
};

const SECCIONES: Seccion[] = [
  { valor: 'indicadores', etiqueta: 'Indicadores', Componente: SeccionIndicadores },
  { valor: 'registros', etiqueta: 'Registros', Componente: SeccionRegistros },
];

/** Prefijo de las consultas de estadísticas (registros e indicadores). */
const CLAVE_ESTADISTICAS = ['estadisticas'];

export default function Estadisticas() {
  const { tienePermiso } = useRol();
  const queryClient = useQueryClient();
  const [elegida, setElegida] = useState<ValorSeccion>('indicadores');
  const [recargando, setRecargando] = useState(false);

  const activa = SECCIONES.find((seccion) => seccion.valor === elegida) ?? SECCIONES[0];

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
      {SECCIONES.length > 1 ? (
        <SelectorSeccion
          opciones={SECCIONES}
          valor={activa.valor}
          onCambiar={setElegida}
          etiqueta="Secciones de Estadísticas"
        />
      ) : null}

      <activa.Componente />
    </Pantalla>
  );
}
