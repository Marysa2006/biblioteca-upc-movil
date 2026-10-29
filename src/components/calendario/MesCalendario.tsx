/**
 * Mi calendario en un mes (HU-30, CA1): cada día con sus compromisos por tipo (ícono, color y
 * cuántos). Al tocar un día se abre su vista Día. Sigue la grilla de la agenda (HU-15), con la
 * semana de lunes a domingo. Las celdas no tienen alto fijo: con letra grande crecen.
 * Es MesAgenda con el conteo por tipo en vez de por estado; se pueden unir más adelante.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaCompleta, grillaMes, numeroDia } from '@/utils/calendario';
import { textoConteoTipos, type ConteoTipos } from '@/utils/miCalendario';

import { TiposDelDia } from './TiposDelDia';

const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  /** Cualquier fecha del mes que se muestra. */
  mes: string;
  hoy: string;
  /** Compromisos de cada día por tipo ('AAAA-MM-DD' → conteo). */
  conteo: Map<string, ConteoTipos>;
  onElegirDia: (fecha: string) => void;
};

export function MesCalendario({ mes, hoy, conteo, onElegirDia }: Props) {
  return (
    <View style={estilos.grilla}>
      {/* Las iniciales son visuales: cada día ya dice su nombre al lector de pantalla. */}
      <View style={estilos.fila} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {INICIALES.map((inicial, i) => (
          <Text key={i} variant="labelMedium" style={estilos.inicial}>
            {inicial}
          </Text>
        ))}
      </View>

      {grillaMes(mes).map((semana, i) => (
        <View key={i} style={estilos.fila}>
          {semana.map((fecha, j) => {
            if (!fecha) return <View key={`vacio-${j}`} style={estilos.celda} />;
            const delDia = conteo.get(fecha);
            const conCompromisos = delDia != null && delDia.total > 0;
            const esHoy = fecha === hoy;
            return (
              <View
                key={fecha}
                style={[estilos.celda, conCompromisos && estilos.celdaConCompromisos, esHoy && estilos.celdaHoy]}
              >
                <TouchableRipple
                  onPress={() => onElegirDia(fecha)}
                  accessibilityRole="button"
                  accessibilityLabel={`${fechaCompleta(fecha)}${esHoy ? ', hoy' : ''}, ${textoConteoTipos(delDia).toLowerCase()}. Ver el día`}
                >
                  <View style={estilos.contenido}>
                    <Text variant="bodyMedium" style={[estilos.numero, esHoy && estilos.numeroHoy]}>
                      {numeroDia(fecha)}
                    </Text>
                    {/* Los compromisos por tipo; sin compromisos, un espacio para que la fila no salte. */}
                    {conCompromisos ? <TiposDelDia conteo={delDia} /> : <Text variant="labelSmall"> </Text>}
                  </View>
                </TouchableRipple>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  grilla: { gap: espacio.xs },
  fila: { flexDirection: 'row', gap: espacio.xs },
  inicial: { flex: 1, textAlign: 'center', color: colores.textoSecundario },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  celda: {
    flex: 1,
    borderRadius: radio.boton,
    borderWidth: 1,
    // Del color del panel: el borde solo se ve en hoy.
    borderColor: colores.superficie,
    overflow: 'hidden',
  },
  celdaConCompromisos: { backgroundColor: colores.primarioSuave },
  celdaHoy: { borderColor: colores.primario },
  // minHeight: 44 px de área táctil; crece con la letra.
  contenido: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: espacio.xs },
  numero: { color: colores.texto, fontFamily: fuentes.seminegrita },
  numeroHoy: { color: colores.primario, fontFamily: fuentes.negrita },
});
