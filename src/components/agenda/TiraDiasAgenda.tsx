/**
 * Los días de la semana en una fila que se desliza de lado, como el encabezado del calendario
 * de la web (HU-15): "Mié 28" y, debajo, cuántas citas tiene. De lunes a sábado: los domingos
 * no hay citas. El día elegido va en el bloque oscuro y hoy lleva borde. Con letra grande cada
 * día crece y la fila se desliza.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { diasAgenda, textoCitas } from '@/utils/agenda';
import { abreviaturaDia, fechaCompleta, numeroDia } from '@/utils/calendario';

type Props = {
  /** Cualquier día de la semana que se muestra. */
  semana: string;
  /** El día elegido (vista Día), o null en la vista Semana. */
  elegido: string | null;
  hoy: string;
  /** Citas de cada día ('AAAA-MM-DD' → cantidad). */
  conteo: Map<string, number>;
  onElegir: (fecha: string) => void;
};

export function TiraDiasAgenda({ semana, elegido, hoy, conteo, onElegir }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.fila}
      accessibilityLabel="Días de la semana"
    >
      {diasAgenda(semana).map((fecha) => {
        const esElegido = fecha === elegido;
        const esHoy = fecha === hoy;
        const citas = conteo.get(fecha) ?? 0;
        const detalle = citas > 0 ? textoCitas(citas) : 'Sin citas';
        return (
          <View
            key={fecha}
            style={[estilos.dia, esHoy && estilos.diaHoy, esElegido && estilos.diaElegido]}
          >
            <TouchableRipple
              onPress={() => onElegir(fecha)}
              style={estilos.contenido}
              accessibilityRole="button"
              accessibilityState={{ selected: esElegido }}
              accessibilityLabel={`${fechaCompleta(fecha)}${esHoy ? ', hoy' : ''}, ${detalle.toLowerCase()}`}
            >
              <View style={estilos.textos}>
                <Text variant="labelLarge" style={[estilos.nombre, esElegido && estilos.textoElegido]}>
                  {`${abreviaturaDia(fecha)} ${numeroDia(fecha)}`}
                </Text>
                <Text
                  variant="labelSmall"
                  style={[estilos.citas, citas > 0 && estilos.conCitas, esElegido && estilos.textoElegido]}
                >
                  {citas > 0 ? textoCitas(citas) : '—'}
                </Text>
              </View>
            </TouchableRipple>
          </View>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: { gap: espacio.s, paddingVertical: espacio.xs },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  dia: {
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficieVariante,
    overflow: 'hidden',
  },
  diaHoy: { borderColor: colores.primario },
  diaElegido: { backgroundColor: colores.primarioOscuro, borderColor: colores.primarioOscuro },
  // minHeight: 44 px de área táctil; crece con la letra.
  contenido: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  textos: { alignItems: 'center', gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  citas: { color: colores.textoSecundario },
  conCitas: { color: colores.primario, fontFamily: fuentes.seminegrita },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoElegido: { color: colores.superficie },
});
