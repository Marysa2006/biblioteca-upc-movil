/**
 * Tarjeta de una solicitud de capacitación en la bandeja del personal (HU-12), con la disposición
 * de TarjetaSolicitud de reservas: tipo y estado, qué se pide, quién y cuándo.
 * Tiene una sola acción, abrir el detalle (capacitaciones/[id]), donde están aprobar, rechazar,
 * proponer otra fecha, asignar responsable y cerrar: la tarjeta entera se toca y lleva
 * chevron-right.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { SolicitudCapacitacion } from '@/types';
import { nombreModalidad, textoParticipantes } from '@/utils/capacitaciones';
import { fechaLegible } from '@/utils/fechas';

type Props = {
  solicitud: SolicitudCapacitacion;
  onAbrir: (solicitud: SolicitudCapacitacion) => void;
};

export function TarjetaSolicitudCapacitacion({ solicitud, onAbrir }: Props) {
  const titulo = `${solicitud.linea} · ${nombreModalidad(solicitud.modalidad)}`;
  const cuando = `${fechaLegible(solicitud.fecha)} · ${solicitud.hora}`;
  const participantes = textoParticipantes(solicitud.participantes);
  const propuesta =
    solicitud.estado === 'nueva_fecha' && solicitud.fechaPropuesta
      ? `Fecha propuesta: ${fechaLegible(solicitud.fechaPropuesta)}${
          solicitud.horaPropuesta ? ` · ${solicitud.horaPropuesta}` : ''
        }`
      : null;
  const responsable =
    solicitud.estado === 'aprobada'
      ? solicitud.responsable
        ? `Responsable: ${solicitud.responsable}`
        : 'Sin responsable asignado'
      : null;
  const estado = coloresEstado[solicitud.estado].etiqueta;

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={() => onAbrir(solicitud)}
        accessibilityRole="button"
        accessibilityLabel={[
          `Capacitación: ${titulo}`,
          solicitud.solicitante.nombre,
          `${cuando}, ${participantes}`,
          propuesta,
          responsable,
          `Estado: ${estado}`,
        ]
          .filter(Boolean)
          .join('. ')}
        accessibilityHint="Abre el detalle para gestionarla"
      >
        <View style={estilos.contenido}>
          <View style={estilos.textos}>
            <View style={estilos.encabezado}>
              <Text variant="labelMedium" style={estilos.tipo}>
                Capacitación
              </Text>
              <EtiquetaEstado estado={solicitud.estado} />
            </View>
            <Text variant="titleMedium" style={estilos.titulo}>
              {titulo}
            </Text>
            <Text variant="bodyMedium" style={estilos.secundario}>
              {solicitud.solicitante.programa
                ? `${solicitud.solicitante.nombre} · ${solicitud.solicitante.programa}`
                : solicitud.solicitante.nombre}
            </Text>
            <View style={estilos.detalle}>
              <Text variant="bodyMedium" style={estilos.dato}>
                {cuando}
              </Text>
              <Text variant="bodySmall" style={estilos.secundario}>
                {`${participantes} · ${solicitud.grupo}`}
              </Text>
            </View>
            {propuesta ? (
              <Text variant="bodySmall" style={estilos.dato}>
                {propuesta}
              </Text>
            ) : null}
            {responsable ? (
              <Text variant="bodySmall" style={estilos.secundario}>
                {responsable}
              </Text>
            ) : null}
          </View>
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, padding: espacio.m },
  textos: { flex: 1, gap: espacio.s },
  // Con letra grande, la etiqueta del estado baja a la línea siguiente.
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  tipo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  detalle: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
