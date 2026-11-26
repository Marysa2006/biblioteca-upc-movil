/**
 * Sección Registros de Estadísticas (HU-25, CA3): las operaciones registradas, de la más
 * reciente a la más antigua, con todos sus campos. Los indicadores van en SeccionIndicadores.
 * Desde el #307 usa los mismos filtros que los indicadores (BarraEstadisticas): así lo que se ve
 * aquí es lo que exporta «Para Excel».
 */
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { TarjetaRegistro } from '@/components/estadisticas/TarjetaRegistro';
import { Esqueleto, EstadoError, EstadoVacio, ListaPaginada } from '@/components/ui';
import { useRegistrosUso } from '@/hooks/useEstadisticas';
import { colores, espacio } from '@/theme';
import type { FiltrosEstadisticas } from '@/types';
import { hayFiltros } from '@/utils/filtrosEstadisticas';

type Props = {
  filtros: FiltrosEstadisticas;
  onQuitarFiltros: () => void;
};

export function SeccionRegistros({ filtros, onQuitarFiltros }: Props) {
  const { data, isPending, isError, refetch } = useRegistrosUso(filtros);

  if (isPending) return <Esqueleto forma="lista" mensaje="Cargando los registros de uso…" />;
  if (isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar los registros de uso."
        onReintentar={() => refetch()}
      />
    );
  }
  if (data.length === 0) {
    if (hayFiltros(filtros)) {
      return (
        <View style={estilos.vacio}>
          <EstadoVacio
            pose="buscando"
            mensaje="No hay operaciones con estos filtros. Prueba con otro periodo u otros valores."
          />
          <Button
            mode="contained-tonal"
            icon="filter-remove-outline"
            onPress={onQuitarFiltros}
            style={estilos.botonVacio}
            accessibilityLabel="Quitar todos los filtros"
          >
            Quitar filtros
          </Button>
        </View>
      );
    }
    return (
      <EstadoVacio mensaje="Todavía no hay operaciones registradas. Cada reserva, asesoría o préstamo que se complete aparecerá aquí." />
    );
  }

  return (
    <View style={estilos.lista}>
      <Text variant="bodyMedium" style={estilos.total} accessibilityRole="header">
        {data.length === 1 ? '1 operación registrada' : `${data.length} operaciones registradas`}
      </Text>
      {/* 10 por página (#161); el total de arriba cuenta todos. */}
      <ListaPaginada elementos={data}>
        {(registro) => <TarjetaRegistro key={registro.id} registro={registro} />}
      </ListaPaginada>
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.s },
  total: { color: colores.textoSecundario },
  vacio: { gap: espacio.m },
  botonVacio: { alignSelf: 'center' },
});
