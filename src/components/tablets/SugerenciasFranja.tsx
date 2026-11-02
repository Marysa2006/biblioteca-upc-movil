/**
 * Sugerencias cuando no quedan tablets (HU-22, CA2): otras franjas del mismo día, las más
 * cercanas primero, o, si el día no tiene ninguna, las que sugiere la API en los días
 * siguientes. Las del 400 al confirmar también llegan aquí. Las de otro día dicen la fecha.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import type { AlternativaPrestamo } from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaCompleta } from '@/utils/calendario';

type Props = {
  /** Qué se consultó, por ejemplo "No quedan tablets de 10:00 a 11:00". */
  mensaje: string;
  sugeridas: AlternativaPrestamo[];
  /** La fecha que se está viendo: las sugeridas de otro día dicen su fecha. */
  fecha: string;
  onElegir: (sugerida: AlternativaPrestamo) => void;
};

export function SugerenciasFranja({ mensaje, sugeridas, fecha, onElegir }: Props) {
  const sinSugeridas = sugeridas.length === 0;

  return (
    <View style={estilos.aviso} accessibilityLiveRegion="polite">
      <View style={estilos.fila}>
        <Icon source="information-outline" size={20} color={colores.primarioOscuro} />
        <Text variant="bodyMedium" style={estilos.texto}>
          {sinSugeridas
            ? `${mensaje}, y no encontramos otras franjas en la próxima semana.`
            : `${mensaje}. Prueba con:`}
        </Text>
      </View>

      {sinSugeridas ? null : (
        <View style={estilos.botones}>
          {sugeridas.map((sugerida) => {
            const horas = `${sugerida.horaInicio} – ${sugerida.horaLimite}`;
            const otroDia = sugerida.fecha !== fecha;
            const dia = fechaCompleta(sugerida.fecha);
            return (
              <Button
                key={`${sugerida.fecha}-${sugerida.horaInicio}`}
                mode="contained-tonal"
                onPress={() => onElegir(sugerida)}
                style={estilos.boton}
                contentStyle={estilos.contenidoBoton}
                labelStyle={estilos.textoBoton}
                accessibilityRole="button"
                accessibilityLabel={`Elegir ${otroDia ? `el ${dia.toLowerCase()}, ` : ''}de ${sugerida.horaInicio} a ${sugerida.horaLimite}`}
              >
                {otroDia ? `${dia} · ${horas}` : horas}
              </Button>
            );
          })}
        </View>
      )}
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
