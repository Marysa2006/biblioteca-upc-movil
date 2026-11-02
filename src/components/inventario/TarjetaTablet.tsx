/**
 * Tablet del inventario (HU-21): modelo, código, serial, accesorios y estado en texto e ícono.
 * Acciones: editar y el cambio de estado rápido (CA3). Una tablet en préstamo no cambia de
 * estado aquí: la devuelve la sección Préstamos (HU-23).
 */
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { EstadoTablet, Tablet } from '@/types';
import { COLOR_ESTADO_TABLET, ICONO_ESTADO_TABLET, NOMBRE_ESTADO_TABLET } from '@/utils/inventario';

/** Cambio rápido de cada estado: a dónde pasa y con qué texto. */
const CAMBIO_RAPIDO: Partial<Record<EstadoTablet, { a: EstadoTablet; texto: string; icono: string }>> = {
  disponible: { a: 'mantenimiento', texto: 'A mantenimiento', icono: 'wrench-outline' },
  mantenimiento: { a: 'disponible', texto: 'Marcar disponible', icono: 'check-circle-outline' },
  de_baja: { a: 'disponible', texto: 'Reintegrar', icono: 'restore' },
};

type Props = {
  tablet: Tablet;
  /** true mientras cambia el estado de esta tablet. */
  cambiando: boolean;
  onEditar: () => void;
  onCambiarEstado: (estado: EstadoTablet) => void;
};

export function TarjetaTablet({ tablet, cambiando, onEditar, onCambiarEstado }: Props) {
  const { fondo, texto } = coloresEstado[COLOR_ESTADO_TABLET[tablet.estado]];
  const cambio = CAMBIO_RAPIDO[tablet.estado];
  const estado = NOMBRE_ESTADO_TABLET[tablet.estado];

  return (
    <View style={[estilos.tarjeta, { borderTopColor: texto }]}>
      <View style={estilos.encabezado}>
        <View style={[estilos.icono, { backgroundColor: fondo }]}>
          <Icon source="tablet" size={24} color={texto} />
        </View>
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.modelo}>
            {tablet.modelo}
          </Text>
          <Text variant="labelLarge" style={[estilos.codigo, { color: texto }]}>
            {tablet.codigo}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {`S/N: ${tablet.serial}`}
          </Text>
        </View>
        <View style={[estilos.estado, { backgroundColor: fondo }]}>
          <Icon source={ICONO_ESTADO_TABLET[tablet.estado]} size={14} color={texto} />
          <Text variant="labelMedium" style={{ color: texto }}>
            {estado}
          </Text>
        </View>
      </View>

      <View style={estilos.accesorios}>
        <Icon source="package-variant-closed" size={18} color={colores.textoSecundario} />
        <Text variant="bodyMedium" style={estilos.textoAccesorios}>
          {tablet.accesorios.length > 0 ? `Incluye: ${tablet.accesorios.join(', ')}` : 'Sin accesorios'}
        </Text>
      </View>

      {tablet.estado === 'en_prestamo' ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          Prestada: se recibe en la sección Préstamos.
        </Text>
      ) : null}

      <View style={estilos.acciones}>
        <Button
          mode="contained-tonal"
          icon="pencil-outline"
          onPress={onEditar}
          disabled={cambiando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Editar la tablet ${tablet.codigo}`}
        >
          Editar
        </Button>
        {cambio ? (
          <Button
            mode="outlined"
            icon={cambio.icono}
            onPress={() => onCambiarEstado(cambio.a)}
            loading={cambiando}
            disabled={cambiando}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={`${cambio.texto}: tablet ${tablet.codigo}, ahora ${estado.toLowerCase()}`}
          >
            {cambio.texto}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderTopWidth: 4,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  icono: { padding: espacio.s, borderRadius: radio.boton },
  textos: { flex: 1, gap: 2 },
  modelo: { color: colores.texto, fontFamily: fuentes.negrita },
  codigo: { fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  accesorios: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  textoAccesorios: { flex: 1, color: colores.texto },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
