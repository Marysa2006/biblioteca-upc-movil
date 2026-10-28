/**
 * Sección Préstamos de Inventario (permiso `tablets`). Archivo de HU-23 (Jhon).
 * Se ve con el permiso que define inventario.tsx.
 *
 * Los préstamos por grupo, con chips: Por entregar (reservados, con Registrar entrega), Por
 * recibir (entregados y vencidos, con Registrar devolución y el tiempo o el retraso) y
 * Devueltos (lo registrado, con novedades y retrasos). Entregar y recibir van en
 * /administracion/prestamo. La alerta de vencidos es de la sección Vencidos (HU-24).
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TarjetaPrestamo } from '@/components/inventario/TarjetaPrestamo';
import { ChipsFiltro, EstadoCarga, EstadoError, EstadoVacio, type OpcionFiltro } from '@/components/ui';
import { usePrestamos, useTablets } from '@/hooks/useTablets';
import { espacio } from '@/theme';
import { NOMBRE_GRUPO, prestamosDeGrupo, type GrupoPrestamos } from '@/utils/prestamos';

const GRUPOS: GrupoPrestamos[] = ['entregar', 'recibir', 'devueltos'];

const VACIO: Record<GrupoPrestamos, string> = {
  entregar: 'No hay préstamos reservados por entregar.',
  recibir: 'No hay tablets prestadas por recibir.',
  devueltos: 'Todavía no hay devoluciones registradas.',
};

export function SeccionPrestamos() {
  const prestamos = usePrestamos('todas');
  const tablets = useTablets();
  const [grupo, setGrupo] = useState<GrupoPrestamos>('entregar');

  if (prestamos.isPending || tablets.isPending) return <EstadoCarga mensaje="Cargando los préstamos…" />;
  if (prestamos.isError || tablets.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar los préstamos."
        onReintentar={() => {
          prestamos.refetch();
          tablets.refetch();
        }}
      />
    );
  }

  const opciones: OpcionFiltro<GrupoPrestamos>[] = GRUPOS.map((valor) => ({
    valor,
    etiqueta: NOMBRE_GRUPO[valor],
    cantidad: prestamosDeGrupo(prestamos.data, valor).length,
  }));
  const visibles = prestamosDeGrupo(prestamos.data, grupo);
  const tabletPorId = new Map(tablets.data.map((tablet) => [tablet.id, tablet]));

  const abrir = (id: string, modo: 'entrega' | 'devolucion') =>
    router.push({ pathname: '/administracion/prestamo', params: { id, modo } });

  return (
    <View style={estilos.seccion}>
      <ChipsFiltro opciones={opciones} valor={grupo} onCambiar={setGrupo} descripcion="Filtrar préstamos" />
      {visibles.length === 0 ? (
        <EstadoVacio mensaje={VACIO[grupo]} />
      ) : (
        visibles.map((prestamo) => (
          <TarjetaPrestamo
            key={prestamo.id}
            prestamo={prestamo}
            tablet={tabletPorId.get(prestamo.tabletId)}
            onEntregar={() => abrir(prestamo.id, 'entrega')}
            onRecibir={() => abrir(prestamo.id, 'devolucion')}
          />
        ))
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
});
