/**
 * Las franjas de 1 hora de un día con las tablets que quedan (HU-22). Se elige una disponible;
 * la que no tiene tablets (reservada) también se puede tocar, y entonces se sugieren otras
 * (CA2). Las que ya pasaron o no cumplen la anticipación se ven con su motivo y no se tocan.
 * Cada fila disponible es un radio: el lector de pantalla dice cuál está elegida.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

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

export function ListaFranjasTablet({ franjas, elegida, onElegir, onConsultarAgotada }: Props) {
  return (
    <View style={estilos.lista} accessibilityRole="radiogroup" accessibilityLabel="Franjas del día">
      {franjas.map((franja) => {
        const horas = `${franja.horaInicio} – ${franja.horaFin}`;
        const disponible = franja.estado === 'disponible';
        const agotada = franja.estado === 'reservada';
        const esElegida = disponible && franja.horaInicio === elegida;
        const detalle = disponible
          ? textoLibres(franja.libres)
          : agotada
            ? 'Sin tablets'
            : (franja.motivo ?? 'No disponible');

        const contenido = (
          <View style={estilos.contenido}>
            <Icon
              source={
                esElegida ? 'radiobox-marked' : disponible ? 'radiobox-blank' : 'minus-circle-outline'
              }
              size={24}
              color={esElegida ? colores.superficie : disponible ? colores.primario : colores.textoSecundario}
            />
            <View style={estilos.textos}>
              <Text variant="titleSmall" style={[estilos.horas, esElegida && estilos.textoElegido]}>
                {horas}
              </Text>
              <Text variant="bodySmall" style={esElegida ? estilos.textoElegido : estilos.detalle}>
                {detalle}
              </Text>
            </View>
          </View>
        );

        return (
          <View
            key={franja.horaInicio}
            style={[estilos.fila, esElegida && estilos.filaElegida, !disponible && estilos.filaApagada]}
          >
            {disponible || agotada ? (
              <TouchableRipple
                onPress={() => (agotada ? onConsultarAgotada(franja) : onElegir(franja))}
                accessibilityRole={agotada ? 'button' : 'radio'}
                accessibilityState={agotada ? undefined : { checked: esElegida }}
                accessibilityLabel={
                  agotada
                    ? `De ${franja.horaInicio} a ${franja.horaFin}, sin tablets. Ver otras franjas`
                    : `De ${franja.horaInicio} a ${franja.horaFin}, ${detalle.toLowerCase()}`
                }
              >
                {contenido}
              </TouchableRipple>
            ) : (
              <View
                accessible
                accessibilityState={{ disabled: true }}
                accessibilityLabel={`De ${franja.horaInicio} a ${franja.horaFin}, no disponible: ${detalle}`}
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
  lista: { gap: espacio.s },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  fila: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  filaElegida: { backgroundColor: colores.primarioOscuro },
  filaApagada: { backgroundColor: colores.superficieVariante },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  horas: { color: colores.texto, fontFamily: fuentes.seminegrita },
  detalle: { color: colores.textoSecundario },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoElegido: { color: colores.superficie },
});
