/**
 * La agenda de un mes (HU-15): cada día con cuántas citas tiene. Al tocar un día se abre su
 * vista Día. Sigue la grilla de VistaMes (HU-17), con la semana de lunes a domingo; los días
 * pasados también se tocan, porque en ellos se registra el resultado (CA3).
 * Las celdas no tienen alto fijo: con letra grande crecen hacia abajo.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { textoCitas } from '@/utils/agenda';
import { fechaCompleta, grillaMes, numeroDia } from '@/utils/calendario';

const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  /** Cualquier fecha del mes que se muestra. */
  mes: string;
  hoy: string;
  /** Citas de cada día ('AAAA-MM-DD' → cantidad). */
  conteo: Map<string, number>;
  onElegirDia: (fecha: string) => void;
};

export function MesAgenda({ mes, hoy, conteo, onElegirDia }: Props) {
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
            const citas = conteo.get(fecha) ?? 0;
            const esHoy = fecha === hoy;
            return (
              <View
                key={fecha}
                style={[estilos.celda, citas > 0 && estilos.celdaConCitas, esHoy && estilos.celdaHoy]}
              >
                <TouchableRipple
                  onPress={() => onElegirDia(fecha)}
                  accessibilityRole="button"
                  accessibilityLabel={`${fechaCompleta(fecha)}${esHoy ? ', hoy' : ''}, ${citas > 0 ? textoCitas(citas) : 'sin citas'}. Ver el día`}
                >
                  <View style={estilos.contenido}>
                    <Text variant="bodyMedium" style={[estilos.numero, esHoy && estilos.numeroHoy]}>
                      {numeroDia(fecha)}
                    </Text>
                    {/* El número de citas; sin citas, un espacio para que la fila no salte. */}
                    <Text variant="labelSmall" style={estilos.citas}>
                      {citas > 0 ? `● ${citas}` : ' '}
                    </Text>
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
  celdaConCitas: { backgroundColor: colores.primarioSuave },
  celdaHoy: { borderColor: colores.primario },
  // minHeight: 44 px de área táctil; crece con la letra.
  contenido: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: espacio.xs },
  numero: { color: colores.texto, fontFamily: fuentes.seminegrita },
  numeroHoy: { color: colores.primario, fontFamily: fuentes.negrita },
  citas: { color: colores.primario, fontFamily: fuentes.seminegrita },
});
