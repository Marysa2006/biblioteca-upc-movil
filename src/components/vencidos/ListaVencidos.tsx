/**
 * Los préstamos vencidos para el encargado de tablets (HU-24). Va dentro de SeccionVencidos
 * (Inventario, #92): la sección pide los vencidos con su hook y los pasa por props.
 * - CA2: con vencidos, un aviso arriba para el responsable, y los más atrasados primero.
 * - CA3: sin vencidos, un mensaje y ningún aviso.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { EstadoVacio } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Prestamo } from '@/types';
import { limitePrestamo, textoCantidadVencidos } from '@/utils/vencidos';

import { TarjetaPrestamoVencido } from './TarjetaPrestamoVencido';

type Props = {
  /** Los préstamos con estado 'vencido'. */
  prestamos: Prestamo[];
  /** El código de la tablet de cada préstamo, por ejemplo "TAB-003". */
  codigoTablet: (tabletId: string) => string;
  ahora?: Date;
};

export function ListaVencidos({ prestamos, codigoTablet, ahora = new Date() }: Props) {
  if (prestamos.length === 0) {
    return <EstadoVacio mensaje="No hay préstamos vencidos: todas las tablets están a tiempo." />;
  }

  const ordenados = [...prestamos].sort(
    (a, b) => limitePrestamo(a).getTime() - limitePrestamo(b).getTime(),
  );

  return (
    <View style={estilos.lista}>
      <View style={estilos.aviso} accessibilityLiveRegion="polite">
        <Icon source="alert-circle-outline" size={24} color={coloresEstado.rechazada.texto} />
        <View style={estilos.textosAviso}>
          <Text variant="titleSmall" style={estilos.tituloAviso}>
            {textoCantidadVencidos(prestamos.length)}
          </Text>
          <Text variant="bodyMedium" style={estilos.texto}>
            Contacta a las personas para que devuelvan las tablets en el mostrador.
          </Text>
        </View>
      </View>

      {ordenados.map((prestamo) => (
        <TarjetaPrestamoVencido
          key={prestamo.id}
          prestamo={prestamo}
          codigoTablet={codigoTablet(prestamo.tabletId)}
          ahora={ahora}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.s },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  textosAviso: { flex: 1, gap: espacio.xs },
  tituloAviso: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
});
