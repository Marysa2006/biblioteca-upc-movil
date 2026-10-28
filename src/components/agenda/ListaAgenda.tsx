/**
 * Las citas de la agenda del facilitador (HU-15, CA1) en la vista del día o de la semana.
 * El día muestra sus citas por hora; la semana, un encabezado por cada día con citas.
 * Recibe las citas del periodo ya pedidas: no consulta ni filtra por facilitador.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EstadoVacio } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { Cita, EstadoSolicitud } from '@/types';
import { agruparCitasPorDia, citasDelDia, nombreEstadoAgenda } from '@/utils/agenda';
import { fechaCompleta } from '@/utils/calendario';

import { TarjetaCitaAgenda } from './TarjetaCitaAgenda';

type Props = {
  vista: 'dia' | 'semana';
  /** El día que se ve; en la semana no se usa, porque las citas ya son de esa semana. */
  fecha: string;
  citas: Cita[];
  mostrarFacilitador: boolean;
  /** El estado de las convenciones por el que se filtra: el mensaje vacío lo nombra. */
  filtro?: EstadoSolicitud | null;
  onAbrir: (cita: Cita) => void;
};

export function ListaAgenda({ vista, fecha, citas, mostrarFacilitador, filtro, onAbrir }: Props) {
  // La administración ve las citas de todos: no son "sus" citas.
  const quien = mostrarFacilitador ? 'No hay citas' : 'No tienes citas';
  const sinCitas = filtro ? `${quien} ${nombreEstadoAgenda(filtro, 2)}` : quien;

  if (vista === 'dia') {
    const delDia = citasDelDia(citas, fecha);
    if (delDia.length === 0) return <EstadoVacio mensaje={`${sinCitas} este día.`} />;
    return (
      <View style={estilos.citas}>
        {delDia.map((cita) => (
          <TarjetaCitaAgenda
            key={cita.id}
            cita={cita}
            mostrarFacilitador={mostrarFacilitador}
            onAbrir={onAbrir}
          />
        ))}
      </View>
    );
  }

  const dias = agruparCitasPorDia(citas);
  if (dias.length === 0) return <EstadoVacio mensaje={`${sinCitas} esta semana.`} />;

  return (
    <View style={estilos.dias}>
      {dias.map((dia) => (
        <View key={dia.fecha} style={estilos.citas}>
          <Text variant="titleSmall" style={estilos.dia} accessibilityRole="header">
            {fechaCompleta(dia.fecha)}
          </Text>
          {dia.citas.map((cita) => (
            <TarjetaCitaAgenda
              key={cita.id}
              cita={cita}
              mostrarFacilitador={mostrarFacilitador}
              onAbrir={onAbrir}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  dias: { gap: espacio.l },
  citas: { gap: espacio.s },
  dia: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
