/**
 * Sección Registros de Estadísticas (HU-25, CA3): las operaciones registradas, de la más
 * reciente a la más antigua, con todos sus campos. Los indicadores van en SeccionIndicadores.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { TarjetaRegistro } from '@/components/estadisticas/TarjetaRegistro';
import { EstadoCarga, EstadoError, EstadoVacio, ListaPaginada } from '@/components/ui';
import { useRegistrosUso } from '@/hooks/useEstadisticas';
import { colores, espacio } from '@/theme';

export function SeccionRegistros() {
  const { data, isPending, isError, refetch } = useRegistrosUso();

  if (isPending) return <EstadoCarga mensaje="Cargando los registros de uso…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar los registros de uso." onReintentar={() => refetch()} />;
  }
  if (data.length === 0) {
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
});
