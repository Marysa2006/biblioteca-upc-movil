/**
 * Una cita en la agenda del facilitador (HU-15, CA1): la hora, el estado, el tema y quién la pidió.
 * La administración ve también al facilitador. Se presiona entera y abre el detalle (CA2).
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';

type Props = {
  cita: Cita;
  /** La administración ve las citas de todos los facilitadores. */
  mostrarFacilitador: boolean;
  onAbrir: (cita: Cita) => void;
};

export function TarjetaCitaAgenda({ cita, mostrarFacilitador, onAbrir }: Props) {
  const horas = `${cita.horaInicio} – ${cita.horaFin}`;
  const modalidad = cita.modalidad === 'virtual' ? 'Virtual' : 'Presencial';
  const facilitador = mostrarFacilitador ? `, con ${cita.facilitador}` : '';

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
              <EtiquetaEstado estado={cita.estado} />
            </View>
            <Text variant="titleMedium" style={estilos.tema}>
              {cita.tema}
            </Text>
            <Text variant="bodyMedium" style={estilos.texto}>
              {cita.solicitante}
            </Text>
            <Text variant="bodySmall" style={estilos.secundario}>
              {mostrarFacilitador ? `${modalidad} · ${cita.facilitador}` : modalidad}
            </Text>
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
  tema: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
});
