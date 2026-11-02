/**
 * Los compromisos de Mi calendario (HU-30, CA1) en la vista del día o de la semana.
 * El día muestra los suyos por hora; la semana, un encabezado por cada día con compromisos.
 * Recibe los compromisos del periodo ya armados: no consulta.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EstadoVacio } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import { fechaCompleta } from '@/utils/calendario';
import { agruparPorDia, compromisosDelDia, type Compromiso } from '@/utils/miCalendario';

import { TarjetaCompromiso } from './TarjetaCompromiso';

type Props = {
  vista: 'dia' | 'semana';
  /** El día que se ve; en la semana no se usa, porque los compromisos ya son de esa semana. */
  fecha: string;
  compromisos: Compromiso[];
};

export function ListaCompromisos({ vista, fecha, compromisos }: Props) {
  if (vista === 'dia') {
    const delDia = compromisosDelDia(compromisos, fecha);
    if (delDia.length === 0) return <EstadoVacio mensaje="No tienes compromisos este día." />;
    return (
      <View style={estilos.lista}>
        {delDia.map((compromiso) => (
          <TarjetaCompromiso key={compromiso.id} compromiso={compromiso} />
        ))}
      </View>
    );
  }

  const dias = agruparPorDia(compromisos);
  if (dias.length === 0) return <EstadoVacio mensaje="No tienes compromisos esta semana." />;

  return (
    <View style={estilos.dias}>
      {dias.map((dia) => (
        <View key={dia.fecha} style={estilos.lista}>
          <Text variant="titleSmall" style={estilos.dia} accessibilityRole="header">
            {fechaCompleta(dia.fecha)}
          </Text>
          {dia.compromisos.map((compromiso) => (
            <TarjetaCompromiso key={compromiso.id} compromiso={compromiso} />
          ))}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  dias: { gap: espacio.l },
  lista: { gap: espacio.s },
  dia: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
