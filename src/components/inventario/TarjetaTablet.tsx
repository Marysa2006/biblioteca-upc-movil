/**
 * Tablet del inventario (HU-21): código, modelo, marca, valor, serial, accesorios y estado en texto
 * e ícono. Versión 1.1 (#253): la marca y el valor del bien, que van en la constancia.
 * Acciones en el menú ⋮ (MenuAcciones): editar y el cambio de estado rápido (CA3). Una tablet en
 * préstamo no cambia de estado aquí: la devuelve Gestión → Préstamos (HU-23).
 * Revisión de la 1.1: sin la barra de color de arriba (el estado ya lo dicen la etiqueta y su
 * ícono), con borde fino y los datos en tres líneas, como las tarjetas de Préstamos.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { MenuAcciones, type AccionMenu } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { EstadoTablet, Tablet } from '@/types';
import { COLOR_ESTADO_TABLET, ICONO_ESTADO_TABLET, NOMBRE_ESTADO_TABLET } from '@/utils/inventario';
import { valorEnPesos } from '@/utils/prestamos';

/** Cambio rápido de cada estado: a dónde pasa y con qué texto. */
const CAMBIO_RAPIDO: Partial<
  Record<EstadoTablet, { a: EstadoTablet; texto: string; icono: string }>
> = {
  disponible: { a: 'mantenimiento', texto: 'Enviar a mantenimiento', icono: 'wrench-outline' },
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
  const datos = [
    tablet.marca ?? 'Marca sin registrar',
    tablet.valor != null ? valorEnPesos(tablet.valor) : 'Valor sin registrar',
    `S/N ${tablet.serial}`,
  ].join(' · ');

  const acciones: AccionMenu[] = [
    {
      titulo: 'Editar',
      icono: 'pencil-outline',
      onPress: onEditar,
      etiqueta: `Editar la tablet ${tablet.codigo}`,
    },
    ...(cambio
      ? [
          {
            titulo: cambio.texto,
            icono: cambio.icono,
            onPress: () => onCambiarEstado(cambio.a),
            etiqueta: `${cambio.texto}: tablet ${tablet.codigo}, ahora ${estado.toLowerCase()}`,
          },
        ]
      : []),
  ];

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.titulo}>
            {`${tablet.codigo} · ${tablet.modelo}`}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {datos}
          </Text>
        </View>
        <View style={[estilos.estado, { backgroundColor: fondo }]}>
          <Icon source={ICONO_ESTADO_TABLET[tablet.estado]} size={14} color={texto} />
          <Text variant="labelMedium" style={{ color: texto }}>
            {estado}
          </Text>
        </View>
        <MenuAcciones
          acciones={acciones}
          descripcion={`Acciones de la tablet ${tablet.codigo}`}
          ocupado={cambiando}
        />
      </View>

      <Text variant="bodySmall" style={estilos.texto}>
        {tablet.accesorios.length > 0
          ? `Incluye: ${tablet.accesorios.join(', ').toLowerCase()}`
          : 'Sin accesorios'}
      </Text>

      {tablet.estado === 'en_prestamo' ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          Prestada: se recibe en Gestión → Préstamos.
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  texto: { color: colores.texto },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
});
