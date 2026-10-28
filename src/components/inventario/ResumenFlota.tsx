/**
 * Resumen de la flota de tablets (HU-21), como en el mockup de Inventario: total, disponibles,
 * en préstamo y en mantenimiento. Cada tarjeta lleva el número y el nombre, no solo color.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { COLOR_ESTADO_TABLET, ICONO_ESTADO_TABLET, type ResumenFlota as Resumen } from '@/utils/inventario';

type Props = { resumen: Resumen };

export function ResumenFlota({ resumen }: Props) {
  const tarjetas = [
    { titulo: 'Total', valor: resumen.total, icono: 'tablet', color: colores.primarioOscuro, detalle: resumen.de_baja > 0 ? `${resumen.de_baja} de baja` : 'Toda la flota' },
    { titulo: 'Disponibles', valor: resumen.disponible, icono: ICONO_ESTADO_TABLET.disponible, color: coloresEstado[COLOR_ESTADO_TABLET.disponible].texto, detalle: 'Listas para prestar' },
    { titulo: 'En préstamo', valor: resumen.en_prestamo, icono: ICONO_ESTADO_TABLET.en_prestamo, color: coloresEstado[COLOR_ESTADO_TABLET.en_prestamo].texto, detalle: 'Entregadas hoy' },
    { titulo: 'Mantenimiento', valor: resumen.mantenimiento, icono: ICONO_ESTADO_TABLET.mantenimiento, color: coloresEstado[COLOR_ESTADO_TABLET.mantenimiento].texto, detalle: 'No se prestan' },
  ];

  return (
    <View style={estilos.grilla}>
      {tarjetas.map((tarjeta) => (
        <View
          key={tarjeta.titulo}
          style={estilos.tarjeta}
          accessible
          accessibilityLabel={`${tarjeta.titulo}: ${tarjeta.valor}. ${tarjeta.detalle}`}
        >
          <View style={estilos.encabezado}>
            <Text variant="labelMedium" style={[estilos.titulo, { color: tarjeta.color }]}>
              {tarjeta.titulo.toUpperCase()}
            </Text>
            <Icon source={tarjeta.icono} size={20} color={tarjeta.color} />
          </View>
          <Text variant="headlineMedium" style={[estilos.valor, { color: tarjeta.color }]}>
            {tarjeta.valor}
          </Text>
          <Text variant="bodySmall" style={estilos.detalle}>
            {tarjeta.detalle}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // Dos por fila; con letra grande siguen creciendo hacia abajo.
  tarjeta: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espacio.s },
  titulo: { flexShrink: 1, fontFamily: fuentes.seminegrita },
  valor: { fontFamily: fuentes.negrita },
  detalle: { color: colores.textoSecundario },
});
