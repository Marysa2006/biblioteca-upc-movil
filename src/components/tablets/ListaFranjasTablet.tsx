/**
 * Las horas de inicio de un día, en punto y y media, con las tablets que quedan en su primera
 * hora (HU-22 y #163). Van en una grilla de tres columnas: con un inicio cada 30 minutos, una
 * fila por hora haría la lista muy larga. Las horas que dura el préstamo se eligen después.
 * Se elige una disponible; la que no tiene tablets (reservada) también se puede tocar, y
 * entonces se sugieren otras (CA2). Las que ya pasaron o no cumplen la anticipación se ven
 * apagadas y no se tocan; el lector de pantalla dice el motivo.
 * Cada hora disponible es un radio: el lector de pantalla dice cuál está elegida.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import type { FranjaTablets } from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import { textoLibres } from '@/utils/tablets';

type Props = {
  franjas: FranjaTablets[];
  /** horaInicio de la franja elegida, o vacío. */
  elegida: string;
  onElegir: (franja: FranjaTablets) => void;
  /** Se tocó una franja sin tablets (CA2). */
  onConsultarAgotada: (franja: FranjaTablets) => void;
};

/** "Quedan 2 tablets" → "Quedan 2", para que quepa en la celda. */
function libresCorto(libres: number): string {
  return textoLibres(libres).replace(/ tablets?$/, '');
}

export function ListaFranjasTablet({ franjas, elegida, onElegir, onConsultarAgotada }: Props) {
  return (
    <View
      style={estilos.grilla}
      accessibilityRole="radiogroup"
      accessibilityLabel="Horas de inicio"
    >
      {franjas.map((franja) => {
        const disponible = franja.estado === 'disponible';
        const agotada = franja.estado === 'reservada';
        const esElegida = disponible && franja.horaInicio === elegida;
        let detalle = 'No disponible';
        if (disponible) detalle = libresCorto(franja.libres);
        else if (agotada) detalle = 'Sin tablets';
        else if (franja.motivo === 'Ya pasó') detalle = franja.motivo;
        const motivo = disponible ? textoLibres(franja.libres) : (franja.motivo ?? 'No disponible');

        const contenido = (
          <View style={estilos.contenido}>
            <Text variant="titleSmall" style={[estilos.hora, esElegida && estilos.textoElegido]}>
              {franja.horaInicio}
            </Text>
            <Text
              variant="bodySmall"
              style={esElegida ? estilos.textoElegido : estilos.detalle}
              numberOfLines={1}
            >
              {detalle}
            </Text>
          </View>
        );

        return (
          <View
            key={franja.horaInicio}
            style={[
              estilos.celda,
              esElegida && estilos.celdaElegida,
              !disponible && estilos.celdaApagada,
            ]}
          >
            {disponible || agotada ? (
              <TouchableRipple
                onPress={() => (agotada ? onConsultarAgotada(franja) : onElegir(franja))}
                accessibilityRole={agotada ? 'button' : 'radio'}
                accessibilityState={agotada ? undefined : { checked: esElegida }}
                accessibilityLabel={
                  agotada
                    ? `A las ${franja.horaInicio}, sin tablets. Ver otras horas`
                    : `A las ${franja.horaInicio}, ${motivo.toLowerCase()}`
                }
              >
                {contenido}
              </TouchableRipple>
            ) : (
              <View
                accessible
                accessibilityState={{ disabled: true }}
                accessibilityLabel={`A las ${franja.horaInicio}, no disponible: ${motivo}`}
              >
                {contenido}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // Tres por fila; overflow: 'hidden' recorta el ripple al borde redondeado.
  celda: {
    flexBasis: '30%',
    flexGrow: 1,
    maxWidth: '33%',
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  celdaElegida: { backgroundColor: colores.primarioOscuro },
  celdaApagada: { backgroundColor: colores.superficieVariante },
  // Más alta que los 48 px del área táctil, con la hora y lo que queda.
  contenido: { minHeight: 56, justifyContent: 'center', gap: 2, padding: espacio.s },
  hora: { color: colores.texto, fontFamily: fuentes.seminegrita },
  detalle: { color: colores.textoSecundario },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoElegido: { color: colores.superficie },
});
