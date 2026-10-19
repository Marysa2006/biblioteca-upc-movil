/**
 * Vista mensual del calendario de un espacio (HU-17, CA1 y CA2).
 * Una grilla de lunes a domingo con el número y el ícono del resumen de cada día; el lector
 * de pantalla lee el día completo y su resumen. Tocar un día abre su semana.
 * Los días pasados se ven atenuados y no se presionan.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { DiaDisponibilidad } from '@/types';
import { fechaCompleta, grillaMes, numeroDia, resumenDia } from '@/utils/calendario';
import { RESUMEN_DIA } from '@/utils/disponibilidad';

/** Iniciales de lunes a domingo; X es miércoles, para no repetir la M de martes. */
const INICIALES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

type Props = {
  /** Cualquier fecha del mes que se muestra. */
  mes: string;
  dias: DiaDisponibilidad[];
  /** Hoy ('AAAA-MM-DD'): los días anteriores no se presionan. */
  hoy: string;
  onElegirDia: (fecha: string) => void;
};

export function VistaMes({ mes, dias, hoy, onElegirDia }: Props) {
  const porFecha = new Map(dias.map((dia) => [dia.fecha, dia]));

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
          {semana.map((fecha, j) =>
            fecha ? (
              <CeldaDia
                key={fecha}
                fecha={fecha}
                dia={porFecha.get(fecha)}
                esHoy={fecha === hoy}
                pasado={fecha < hoy}
                onPress={() => onElegirDia(fecha)}
              />
            ) : (
              <View key={`vacio-${j}`} style={estilos.celda} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function CeldaDia({
  fecha,
  dia,
  esHoy,
  pasado,
  onPress,
}: {
  fecha: string;
  dia?: DiaDisponibilidad;
  esHoy: boolean;
  pasado: boolean;
  onPress: () => void;
}) {
  const resumen = dia && !pasado ? resumenDia(dia) : null;
  const marca = resumen ? RESUMEN_DIA[resumen.tipo] : null;
  const numero = (
    <View style={estilos.contenidoCelda}>
      <Text
        variant="bodyMedium"
        style={[estilos.numero, pasado ? estilos.numeroPasado : null, esHoy ? estilos.numeroHoy : null]}
      >
        {numeroDia(fecha)}
      </Text>
      {marca ? <Icon source={marca.icono} size={16} color={marca.color} /> : null}
    </View>
  );

  if (pasado) {
    return (
      <View style={estilos.celda} accessible accessibilityLabel={`${fechaCompleta(fecha)}, ya pasó`}>
        {numero}
      </View>
    );
  }

  return (
    <View style={[estilos.celda, esHoy ? estilos.celdaHoy : null]}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${esHoy ? 'Hoy, ' : ''}${fechaCompleta(fecha)}${resumen ? `, ${resumen.texto}` : ''}. Ver la semana`}
      >
        {numero}
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  grilla: { gap: espacio.xs },
  fila: { flexDirection: 'row', gap: espacio.xs },
  inicial: { flex: 1, textAlign: 'center', color: colores.textoSecundario },
  // Sin alto fijo: con letra grande, la celda crece hacia abajo.
  celda: { flex: 1, borderRadius: radio.boton, overflow: 'hidden' },
  celdaHoy: { backgroundColor: colores.primarioSuave },
  contenidoCelda: { alignItems: 'center', gap: espacio.xs, paddingVertical: espacio.s },
  numero: { color: colores.texto, fontFamily: fuentes.seminegrita },
  numeroPasado: { color: colores.textoSecundario, fontFamily: fuentes.regular },
  numeroHoy: { color: colores.primario, fontFamily: fuentes.negrita },
});
