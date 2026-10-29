/**
 * Los días de la semana en una tira, con el mismo estilo que la semana de los espacios (HU-17):
 * el día ("Mié"), el número grande y, debajo, sus citas por estado (HU-15). De lunes a sábado:
 * los domingos no hay citas. Los seis días se reparten el ancho, sin deslizar; con letra grande
 * cada día crece y la tira se desplaza de lado. El día elegido va en el bloque oscuro y hoy
 * lleva borde.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { diasAgenda, textoConteoDia, type ConteoDia } from '@/utils/agenda';
import { abreviaturaDia, fechaCompleta, numeroDia } from '@/utils/calendario';

import { EstadosDelDia } from './EstadosDelDia';

type Props = {
  /** Cualquier día de la semana que se muestra. */
  semana: string;
  /** El día elegido (vista Día), o null en la vista Semana. */
  elegido: string | null;
  hoy: string;
  /** Citas de cada día por estado ('AAAA-MM-DD' → conteo). */
  conteo: Map<string, ConteoDia>;
  onElegir: (fecha: string) => void;
};

export function TiraDiasAgenda({ semana, elegido, hoy, conteo, onElegir }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.tira}
      accessibilityLabel="Días de la semana"
    >
      {diasAgenda(semana).map((fecha) => {
        const esElegido = fecha === elegido;
        const esHoy = fecha === hoy;
        const delDia = conteo.get(fecha);
        const conCitas = delDia != null && delDia.total > 0;
        const detalle = textoConteoDia(delDia);
        const colorTexto = esElegido ? colores.superficie : colores.texto;
        return (
          <View
            key={fecha}
            style={[estilos.dia, esHoy && estilos.diaHoy, esElegido && estilos.diaElegido]}
          >
            <TouchableRipple
              onPress={() => onElegir(fecha)}
              accessibilityRole="button"
              accessibilityState={{ selected: esElegido }}
              accessibilityLabel={`${fechaCompleta(fecha)}${esHoy ? ', hoy' : ''}, ${detalle.toLowerCase()}`}
            >
              <View style={estilos.contenidoDia}>
                <Text variant="labelMedium" style={{ color: colorTexto }}>
                  {abreviaturaDia(fecha)}
                </Text>
                <Text variant="titleMedium" style={[estilos.numero, { color: colorTexto }]}>
                  {numeroDia(fecha)}
                </Text>
                {conCitas ? (
                  <EstadosDelDia conteo={delDia} sobreOscuro={esElegido} />
                ) : (
                  <Text variant="labelSmall" style={esElegido ? estilos.textoElegido : estilos.sinCitas}>
                    —
                  </Text>
                )}
              </View>
            </TouchableRipple>
          </View>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  // flexGrow reparte el ancho entre los días; con letra grande, la tira se desplaza de lado.
  tira: { flexGrow: 1, gap: espacio.xs },
  // El borde (del color del fondo salvo hoy) evita que el día de hoy cambie de tamaño.
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  dia: {
    flexGrow: 1,
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.superficie,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  diaHoy: { borderColor: colores.primario },
  diaElegido: { backgroundColor: colores.primarioOscuro, borderColor: colores.primarioOscuro },
  contenidoDia: {
    alignItems: 'center',
    gap: espacio.xs,
    paddingVertical: espacio.s,
    paddingHorizontal: espacio.s,
  },
  numero: { fontFamily: fuentes.negrita },
  sinCitas: { color: colores.textoSecundario },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoElegido: { color: colores.superficie },
});
