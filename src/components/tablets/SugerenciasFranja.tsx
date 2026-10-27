/**
 * Sugerencias cuando no quedan tablets (HU-22, CA2): otras franjas del mismo día, las más
 * cercanas primero, o, si el día ya no tiene ninguna, el siguiente día en que se puede pedir.
 * Las sugeridas salen de franjasSugeridas() o del 400 de la API al confirmar.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaCompleta } from '@/utils/calendario';
import { textoLibres, type FranjaTablet } from '@/utils/tablets';

type Props = {
  /** Qué se consultó, por ejemplo "No quedan tablets de 10:00 a 12:00". */
  mensaje: string;
  sugeridas: FranjaTablet[];
  onElegir: (franja: FranjaTablet) => void;
  /** Sin sugeridas en el día: el siguiente día elegible, o null si no hay. */
  diaSiguiente: string | null;
  onVerDia: (fecha: string) => void;
};

export function SugerenciasFranja({ mensaje, sugeridas, onElegir, diaSiguiente, onVerDia }: Props) {
  const sinFranjas = sugeridas.length === 0;

  return (
    <View style={estilos.aviso} accessibilityLiveRegion="polite">
      <View style={estilos.fila}>
        <Icon source="information-outline" size={20} color={colores.primarioOscuro} />
        <Text variant="bodyMedium" style={estilos.texto}>
          {sinFranjas ? `${mensaje}, y este día ya no quedan otras franjas.` : `${mensaje}. Prueba con:`}
        </Text>
      </View>

      <View style={estilos.botones}>
        {sugeridas.map((franja) => (
          <Button
            key={franja.horaInicio}
            mode="contained-tonal"
            onPress={() => onElegir(franja)}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Elegir de ${franja.horaInicio} a ${franja.horaLimite}, ${textoLibres(franja.libres).toLowerCase()}`}
          >
            {`${franja.horaInicio} – ${franja.horaLimite}`}
          </Button>
        ))}
        {sinFranjas && diaSiguiente ? (
          <Button
            mode="contained-tonal"
            icon="calendar-arrow-right"
            onPress={() => onVerDia(diaSiguiente)}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Ver las franjas del ${fechaCompleta(diaSiguiente).toLowerCase()}`}
          >
            {`Ver el ${fechaCompleta(diaSiguiente).toLowerCase()}`}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  texto: { flex: 1, color: colores.texto },
  // Los botones se reparten la fila y, con letra grande, pasan a la siguiente.
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
