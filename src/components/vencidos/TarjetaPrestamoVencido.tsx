/**
 * Un préstamo vencido en Inventario → Vencidos (HU-24): quién la tiene, qué tablet, la hora
 * límite y cuánto lleva vencido. El estado va con texto, no solo color. No se presiona:
 * la devolución se registra en Préstamos (HU-23).
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Prestamo } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { textoTiempoVencido } from '@/utils/vencidos';

type Props = {
  prestamo: Prestamo;
  /** Código interno de la tablet, por ejemplo "TAB-003". */
  codigoTablet: string;
  ahora: Date;
};

/** El rojo de los estados: un vencido se atiende como una solicitud rechazada. */
const COLOR_VENCIDO = coloresEstado.rechazada;

export function TarjetaPrestamoVencido({ prestamo, codigoTablet, ahora }: Props) {
  const tiempo = textoTiempoVencido(prestamo, ahora);
  const limite = `${fechaLegible(prestamo.fecha)} a las ${prestamo.horaLimite}`;

  return (
    <View
      style={estilos.tarjeta}
      accessible
      accessibilityLabel={`${prestamo.solicitante}, tablet ${codigoTablet}. ${tiempo}. Debía devolverla el ${limite}.`}
    >
      <View style={estilos.encabezado}>
        <View style={estilos.etiqueta}>
          <Text variant="labelMedium" style={estilos.textoEtiqueta}>
            Vencido
          </Text>
        </View>
        <Text variant="bodySmall" style={estilos.tiempo}>
          {tiempo}
        </Text>
      </View>

      <Text variant="titleMedium" style={estilos.nombre}>
        {prestamo.solicitante}
      </Text>

      <View style={estilos.detalle}>
        <Text variant="bodyMedium" style={estilos.dato}>
          {`Tablet ${codigoTablet}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Debía devolverla el ${limite}`}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  // Con letra grande, el tiempo baja a la línea siguiente.
  encabezado: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacio.s },
  etiqueta: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: COLOR_VENCIDO.fondo,
  },
  textoEtiqueta: { color: COLOR_VENCIDO.texto, fontFamily: fuentes.seminegrita },
  tiempo: { color: COLOR_VENCIDO.texto, fontFamily: fuentes.seminegrita },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  detalle: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
});
