/**
 * Inventario: el préstamo de tablets del lado del personal.
 * Cada sección vive en su propio componente de src/components/inventario y se ve con su permiso:
 * - Tablets (`tablets`): el inventario de tablets (HU-21, Jhon).
 * - Préstamos (`tablets`): la entrega y la devolución (HU-23, Jhon).
 * - Vencidos (`tablets`): los préstamos que pasaron la hora límite (HU-24, María).
 * Esta pantalla solo compone: el contenido de cada sección se cambia en su componente, no aquí,
 * para que dos personas no editen el mismo archivo.
 */
import { router } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { Button } from 'react-native-paper';

import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { SeccionPrestamos } from '@/components/inventario/SeccionPrestamos';
import { SeccionTablets } from '@/components/inventario/SeccionTablets';
import { SeccionVencidos } from '@/components/inventario/SeccionVencidos';
import { EstadoVacio, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import type { Permiso } from '@/types';

type ValorSeccion = 'tablets' | 'prestamos' | 'vencidos';

type Seccion = {
  valor: ValorSeccion;
  etiqueta: string;
  Componente: ComponentType;
  /** Se ve con cualquiera de estos permisos. */
  permisos: readonly Permiso[];
};

const SECCIONES: Seccion[] = [
  { valor: 'tablets', etiqueta: 'Tablets', Componente: SeccionTablets, permisos: ['tablets'] },
  { valor: 'prestamos', etiqueta: 'Préstamos', Componente: SeccionPrestamos, permisos: ['tablets'] },
  { valor: 'vencidos', etiqueta: 'Vencidos', Componente: SeccionVencidos, permisos: ['tablets'] },
];

export default function Inventario() {
  const { tienePermiso } = useRol();
  const [elegida, setElegida] = useState<ValorSeccion>('tablets');

  const visibles = SECCIONES.filter((seccion) => seccion.permisos.some(tienePermiso));
  // Si la elegida dejó de verse (o nunca se vio), se muestra la primera visible.
  const activa: Seccion | undefined =
    visibles.find((seccion) => seccion.valor === elegida) ?? visibles[0];

  return (
    <Pantalla titulo="Inventario" subtitulo="Tablets, préstamos y vencidos">
      {activa && visibles.length > 1 ? (
        <SelectorSeccion
          opciones={visibles}
          valor={activa.valor}
          onCambiar={setElegida}
          etiqueta="Secciones de Inventario"
        />
      ) : null}

      {activa ? (
        <activa.Componente />
      ) : (
        <EstadoVacio mensaje="Tu rol no tiene secciones de inventario por ahora." />
      )}

      {/* Spike de cámara (#84): solo en desarrollo, para probar la lectura de códigos de HU-31. */}
      {__DEV__ ? (
        <Button
          mode="outlined"
          icon="barcode-scan"
          onPress={() => router.push('/pruebas/camara')}
          accessibilityRole="button"
          accessibilityLabel="Abrir la prueba de cámara para leer códigos"
        >
          Prueba de cámara (desarrollo)
        </Button>
      ) : null}
    </Pantalla>
  );
}
