/**
 * Los días de la semana en una fila que se desliza de lado (HU-30), como la de la agenda
 * (HU-15): "Mié 28" y, debajo, sus compromisos por tipo. De lunes a sábado. El día elegido va
 * en el bloque oscuro y hoy lleva borde. Con letra grande cada día crece y la fila se desliza.
 * Es TiraDiasAgenda con el conteo por tipo en vez de por estado; se pueden unir más adelante.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { diasAgenda } from '@/utils/agenda';
import { abreviaturaDia, fechaCompleta, numeroDia } from '@/utils/calendario';
import { textoConteoTipos, type ConteoTipos } from '@/utils/miCalendario';

import { TiposDelDia } from './TiposDelDia';

type Props = {
  /** Cualquier día de la semana que se muestra. */
  semana: string;
  /** El día elegido (vista Día), o null en la vista Semana. */
  elegido: string | null;
  hoy: string;
  /** Compromisos de cada día por tipo ('AAAA-MM-DD' → conteo). */
  conteo: Map<string, ConteoTipos>;
  onElegir: (fecha: string) => void;
};

export function TiraDiasCalendario({ semana, elegido, hoy, conteo, onElegir }: Props) {
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
        const delDia = conteo.get(fecha);
        const conCompromisos = delDia != null && delDia.total > 0;
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
              accessibilityLabel={`${fechaCompleta(fecha)}${esHoy ? ', hoy' : ''}, ${textoConteoTipos(delDia).toLowerCase()}`}
            >
              <View style={estilos.textos}>
                <Text variant="labelLarge" style={[estilos.nombre, esElegido && estilos.textoElegido]}>
                  {`${abreviaturaDia(fecha)} ${numeroDia(fecha)}`}
                </Text>
                {conCompromisos ? (
                  <TiposDelDia conteo={delDia} sobreOscuro={esElegido} />
                ) : (
                  <Text variant="labelSmall" style={[estilos.vacio, esElegido && estilos.textoElegido]}>
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
  vacio: { color: colores.textoSecundario },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoElegido: { color: colores.superficie },
});
