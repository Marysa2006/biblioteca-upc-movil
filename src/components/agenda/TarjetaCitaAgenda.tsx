/**
 * Una cita en la agenda del facilitador (HU-15, CA1): la hora, el estado, el tema y quién la pidió.
 * Un ícono pequeño dice la modalidad (presencial o virtual); los temas no tienen ícono propio.
 * La administración ve también al facilitador. Se presiona entera y abre el detalle (CA2).
 * La cita sin facilitador lleva la etiqueta "Sin asignar", con ícono y texto (#250).
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import { ICONO_SIN_ASIGNAR, sinAsignar } from '@/utils/agenda';
import { NOMBRE_MODALIDAD } from '@/utils/jornadas';

type Props = {
  cita: Cita;
  /** La administración ve las citas de todos los facilitadores. */
  mostrarFacilitador: boolean;
  onAbrir: (cita: Cita) => void;
};

export function TarjetaCitaAgenda({ cita, mostrarFacilitador, onAbrir }: Props) {
  const horas = `${[cita.horaInicio,cita.horaFin].filter(Boolean).join(' – ')}`;
  const modalidad = NOMBRE_MODALIDAD[cita.modalidad];
  const libre = sinAsignar(cita);
  const facilitador = libre
    ? ', sin asignar'
    : mostrarFacilitador && cita.facilitador
      ? `, con ${cita.facilitador}`
      : '';

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={() => onAbrir(cita)}
        accessibilityRole="button"
        accessibilityLabel={`${horas}, ${cita.tema}, ${cita.solicitante}${facilitador}. ${coloresEstado[cita.estado].etiqueta}. Ver el detalle`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.textos}>
            <View style={estilos.encabezado}>
              <Text variant="titleSmall" style={estilos.horas}>
                {horas}
              </Text>
              <View style={estilos.etiquetas}>
                <EtiquetaEstado estado={cita.estado} />
                {libre ? (
                  <View style={estilos.sinAsignar}>
                    <Icon source={ICONO_SIN_ASIGNAR} size={14} color={coloresEstado.cancelada.texto} />
                    <Text variant="labelMedium" style={estilos.textoSinAsignar}>
                      Sin asignar
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text variant="titleMedium" style={estilos.tema}>
              {cita.tema}
            </Text>
            <Text variant="bodyMedium" style={estilos.texto}>
              {cita.solicitante}
            </Text>
            <View style={estilos.modalidad}>
              <Icon
                source={cita.modalidad === 'presencial' ? 'account-group-outline' : 'laptop'}
                size={16}
                color={colores.textoSecundario}
              />
              <Text variant="bodySmall" style={estilos.secundario}>
                {mostrarFacilitador && !libre ? `${modalidad} · ${cita.facilitador}` : modalidad}
              </Text>
            </View>
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
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  // Con letra grande, la etiqueta del estado baja a la línea siguiente.
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  horas: { color: colores.primario, fontFamily: fuentes.seminegrita },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  // Como EtiquetaEstado, en el gris de Cancelada: texto y no solo color.
  sinAsignar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s + 2,
    paddingVertical: espacio.xs,
    borderRadius: 999,
    backgroundColor: coloresEstado.cancelada.fondo,
  },
  textoSinAsignar: { color: coloresEstado.cancelada.texto },
  tema: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
  modalidad: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
});
