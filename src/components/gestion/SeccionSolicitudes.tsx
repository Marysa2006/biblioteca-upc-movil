/**
 * Sección Solicitudes de Gestión (permiso `reservas`, `asesorias` o `formacion`): la bandeja
 * de solicitudes de los servicios, según los permisos de cada persona, como en el mockup
 * personal-bandeja.png.
 * - Reservas de espacios (HU-19, permiso `reservas`): BandejaReservas.
 * - Capacitaciones (HU-12, permiso `formacion`): BandejaCapacitaciones.
 * Con los dos permisos, unos botones segmentados eligen la bandeja y dicen cuántas pendientes
 * tiene cada una; se distinguen de las pestañas de Gestión (arriba) y de los chips por estado
 * (abajo). Con uno solo, se ve esa bandeja directamente.
 * Las citas de asesoría se gestionan en Gestión → Agenda (HU-15).
 * Se ve con los permisos que define gestion.tsx.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { BandejaCapacitaciones } from '@/components/capacitaciones/BandejaCapacitaciones';
import { BandejaReservas } from '@/components/reservas/BandejaReservas';
import { EstadoVacio } from '@/components/ui';
import { useSolicitudesCapacitacion } from '@/hooks/useCapacitaciones';
import { useReservas } from '@/hooks/useReservas';
import { useRol } from '@/hooks/useRol';
import { espacio, fuentes } from '@/theme';

type Bandeja = 'reservas' | 'capacitaciones';

export function SeccionSolicitudes() {
  const { tienePermiso } = useRol();
  const reservas = tienePermiso('reservas');
  const capacitaciones = tienePermiso('formacion');

  if (reservas && capacitaciones) return <ConSelector />;
  if (reservas) return <BandejaReservas />;
  if (capacitaciones) return <BandejaCapacitaciones />;
  return <EstadoVacio mensaje="Las citas de asesoría se gestionan en la pestaña Agenda." />;
}

/**
 * Las dos bandejas con su selector. Las consultas de los números son las mismas de cada
 * bandeja (misma clave), así que no se piden dos veces.
 */
function ConSelector() {
  const [bandeja, setBandeja] = useState<Bandeja>('reservas');
  const pendientesReservas =
    useReservas('todas').data?.filter((r) => r.estado === 'pendiente').length ?? 0;
  const pendientesCapacitaciones =
    useSolicitudesCapacitacion('todas').data?.filter((s) => s.estado === 'pendiente').length ?? 0;

  const boton = (valor: Bandeja, nombre: string, pendientes: number) => ({
    value: valor,
    label: pendientes > 0 ? `${nombre} (${pendientes})` : nombre,
    accessibilityLabel:
      pendientes > 0
        ? `${nombre}, ${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`
        : nombre,
    labelStyle: estilos.etiqueta,
  });

  return (
    <View style={estilos.seccion}>
      <SegmentedButtons
        value={bandeja}
        onValueChange={(valor) => setBandeja(valor as Bandeja)}
        buttons={[
          boton('reservas', 'Reservas', pendientesReservas),
          boton('capacitaciones', 'Capacitaciones', pendientesCapacitaciones),
        ]}
      />
      {bandeja === 'reservas' ? <BandejaReservas /> : <BandejaCapacitaciones />}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.m },
  etiqueta: { fontFamily: fuentes.seminegrita },
});
