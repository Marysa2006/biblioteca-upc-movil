/**
 * Tarjeta de una solicitud en Mis solicitudes (HU-08, CA1): el tipo con su ícono y nombre, qué
 * se pidió, cuándo y el estado. Tiene una sola acción, abrir el detalle: la tarjeta entera se
 * toca y lleva chevron-right.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { IconoCategoria } from '@/components/servicios/IconoCategoria';
import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { ResumenSolicitud } from '@/types';
import { textoFechaSolicitud, TIPOS_SOLICITUD, type NotaPrestamo } from '@/utils/solicitudes';

type Props = {
  solicitud: ResumenSolicitud;
  /** Solo en préstamos: su estado real (entregada, vencida…). */
  nota?: NotaPrestamo | null;
  onAbrir: (solicitud: ResumenSolicitud) => void;
};

export function TarjetaMiSolicitud({ solicitud, nota, onAbrir }: Props) {
  const tipo = TIPOS_SOLICITUD[solicitud.tipo];
  const cuando = textoFechaSolicitud(solicitud.fecha, solicitud.hora);
  const estado = coloresEstado[solicitud.estado].etiqueta;

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={() => onAbrir(solicitud)}
        accessibilityRole="button"
        accessibilityLabel={`${tipo.nombre}: ${solicitud.titulo}. ${cuando}. Estado: ${estado}.${
          nota ? ` ${nota.texto}` : ''
        }`}
        accessibilityHint="Abre el detalle y el historial"
      >
        <View style={estilos.contenido}>
          <IconoCategoria categoria={tipo.categoria} tamano={20} />
          <View style={estilos.textos}>
            <Text variant="labelMedium" style={estilos.tipo}>
              {tipo.nombre}
            </Text>
            <Text variant="titleMedium" style={estilos.titulo}>
              {solicitud.titulo}
            </Text>
            <Text variant="bodyMedium" style={estilos.secundario}>
              {cuando}
            </Text>
            <EtiquetaEstado estado={solicitud.estado} />
            {nota ? (
              <View style={estilos.nota}>
                {nota.alerta ? (
                  <Icon source="alert-circle-outline" size={16} color={colores.error} />
                ) : null}
                <Text
                  variant="bodySmall"
                  style={[estilos.textoNota, nota.alerta ? estilos.textoAlerta : null]}
                >
                  {nota.texto}
                </Text>
              </View>
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
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
  },
  textos: { flex: 1, gap: espacio.xs },
  tipo: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  nota: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.xs },
  textoNota: { flex: 1, color: colores.texto },
  textoAlerta: { color: colores.error, fontFamily: fuentes.seminegrita },
});
