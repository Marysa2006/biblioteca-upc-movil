/**
 * Las citas de un día en la agenda (HU-15, CA1), de la primera a la última: la vista Hoy y la
 * lista bajo el mes. Sin citas, el mensaje que le pasa quien la usa (por ejemplo, por qué el
 * día no tiene atención). Recibe las citas ya pedidas: no consulta ni filtra por facilitador.
 */
import { StyleSheet, View } from 'react-native';

import { EstadoVacio } from '@/components/ui';
import { espacio } from '@/theme';
import type { Cita } from '@/types';
import { citasDelDia } from '@/utils/agenda';

import { TarjetaCitaAgenda } from './TarjetaCitaAgenda';

type Props = {
  fecha: string;
  citas: Cita[];
  mostrarFacilitador: boolean;
  /** Lo que se dice si el día no tiene citas. */
  mensajeVacio: string;
  onAbrir: (cita: Cita) => void;
};

export function ListaAgenda({ fecha, citas, mostrarFacilitador, mensajeVacio, onAbrir }: Props) {
  const delDia = citasDelDia(citas, fecha);
  if (delDia.length === 0) return <EstadoVacio mensaje={mensajeVacio} />;

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

const estilos = StyleSheet.create({
  citas: { gap: espacio.s },
});
