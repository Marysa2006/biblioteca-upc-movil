/**
 * Las franjas de un día con las tablets que quedan (HU-22). Se elige una con tablets libres;
 * la que no tiene también se puede tocar, y entonces se sugieren otras (CA2).
 * Cada fila es un radio: el lector de pantalla dice cuál está elegida.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { textoLibres, type FranjaTablet } from '@/utils/tablets';

type Props = {
  franjas: FranjaTablet[];
  /** horaInicio de la franja elegida, o vacío. */
  elegida: string;
  onElegir: (franja: FranjaTablet) => void;
  /** Se tocó una franja sin tablets (CA2). */
  onConsultarAgotada: (franja: FranjaTablet) => void;
};

export function ListaFranjasTablet({ franjas, elegida, onElegir, onConsultarAgotada }: Props) {
  return (
    <View style={estilos.lista} accessibilityRole="radiogroup" accessibilityLabel="Franjas del día">
      {franjas.map((franja) => {
        const horas = `${franja.horaInicio} – ${franja.horaLimite}`;
        const libres = textoLibres(franja.libres);
        const agotada = franja.libres <= 0;
        const esElegida = !agotada && franja.horaInicio === elegida;

        return (
          <View
            key={franja.horaInicio}
            style={[estilos.fila, esElegida && estilos.filaElegida, agotada && estilos.filaAgotada]}
          >
            <TouchableRipple
              onPress={() => (agotada ? onConsultarAgotada(franja) : onElegir(franja))}
              accessibilityRole={agotada ? 'button' : 'radio'}
              accessibilityState={agotada ? undefined : { checked: esElegida }}
              accessibilityLabel={
                agotada
                  ? `De ${franja.horaInicio} a ${franja.horaLimite}, sin tablets. Ver otras franjas`
                  : `De ${franja.horaInicio} a ${franja.horaLimite}, ${libres.toLowerCase()}`
              }
            >
              <View style={estilos.contenido}>
                <Icon
                  source={esElegida ? 'radiobox-marked' : agotada ? 'minus-circle-outline' : 'radiobox-blank'}
                  size={24}
                  color={esElegida ? colores.superficie : agotada ? colores.textoSecundario : colores.primario}
                />
                <View style={estilos.textos}>
                  <Text variant="titleSmall" style={[estilos.horas, esElegida && estilos.textoElegido]}>
                    {horas}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={esElegida ? estilos.textoElegido : estilos.libres}
                  >
                    {libres}
                  </Text>
                </View>
              </View>
            </TouchableRipple>
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
  filaAgotada: { backgroundColor: colores.superficieVariante },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  horas: { color: colores.texto, fontFamily: fuentes.seminegrita },
  libres: { color: colores.textoSecundario },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoElegido: { color: colores.superficie },
});
