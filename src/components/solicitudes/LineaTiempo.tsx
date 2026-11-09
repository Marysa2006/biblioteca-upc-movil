/**
 * Historial de una solicitud como línea de tiempo (HU-08, CA2): del primer paso al más
 * reciente, con el estado (texto y color), cuándo, quién y la nota. El punto de cada paso usa
 * el color de su estado; el texto de la etiqueta lo dice igual, sin depender del color.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { EventoSolicitud } from '@/types';
import { textoFechaEvento } from '@/utils/solicitudes';

/** Diámetro del punto y grosor de la línea que une los pasos. */
const PUNTO = espacio.m;
const LINEA = 2;

export function LineaTiempo({ eventos }: { eventos: EventoSolicitud[] }) {
  return (
    <View accessibilityRole="list">
      {eventos.map((evento, indice) => {
        const ultimo = indice === eventos.length - 1;
        const cuando = textoFechaEvento(evento.fecha);
        const estado = coloresEstado[evento.estado];
        return (
          <View
            key={evento.id}
            style={estilos.paso}
            accessible
            accessibilityLabel={`${estado.etiqueta}. ${cuando}, por ${evento.autor}.${
              evento.nota ? ` ${evento.nota}` : ''
            }`}
          >
            <View style={estilos.guia}>
              <View style={[estilos.punto, { backgroundColor: estado.texto }]} />
              {ultimo ? null : <View style={estilos.linea} />}
            </View>
            <View style={[estilos.textos, ultimo ? null : estilos.separacion]}>
              <EtiquetaEstado estado={evento.estado} />
              <Text variant="bodySmall" style={estilos.secundario}>
                {`${cuando} · ${evento.autor}`}
              </Text>
              {evento.nota ? (
                <Text variant="bodyMedium" style={estilos.nota}>
                  {evento.nota}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  paso: { flexDirection: 'row', gap: espacio.m },
  // La guía ocupa todo el alto del paso: la línea baja hasta el punto siguiente.
  guia: { alignItems: 'center', width: PUNTO },
  punto: { width: PUNTO, height: PUNTO, borderRadius: PUNTO / 2, marginTop: espacio.xs },
  linea: { flex: 1, width: LINEA, backgroundColor: colores.borde, marginTop: espacio.xs },
  textos: { flex: 1, gap: espacio.xs },
  separacion: { paddingBottom: espacio.l },
  secundario: { color: colores.textoSecundario },
  nota: { color: colores.texto, fontFamily: fuentes.regular },
});
