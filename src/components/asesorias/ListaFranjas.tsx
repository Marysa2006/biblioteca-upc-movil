/**
 * Franjas de un tema en la semana que se consulta (HU-14), agrupadas por día. Cada franja es
 * un botón con la hora y los cupos libres, y lleva a la confirmación.
 * Sin franjas, lo dice y sugiere la semana siguiente u otro tema (CA4).
 *
 * Solo pinta: la semana la elige la pantalla con NavegacionPeriodo y las franjas llegan por
 * props desde el hook.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { EstadoVacio } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { FranjaAsesoria } from '@/types';
import { agruparFranjasPorDia, textoCupos } from '@/utils/asesorias';
import { fechaCompleta } from '@/utils/calendario';

type Props = {
  franjas: FranjaAsesoria[];
  onElegir: (franja: FranjaAsesoria) => void;
  onSemanaSiguiente: () => void;
  /** Sin él no se ofrece otro tema: al reprogramar, la cita sigue en el mismo tema. */
  onOtroTema?: () => void;
};

export function ListaFranjas({ franjas, onElegir, onSemanaSiguiente, onOtroTema }: Props) {
  const dias = agruparFranjasPorDia(franjas);

  if (dias.length === 0) {
    const sugerencia = onOtroTema ? 'la semana siguiente u otro tema' : 'la semana siguiente';
    return (
      <View style={estilos.vacio} accessibilityLiveRegion="polite">
        <EstadoVacio mensaje={`No hay franjas para este tema esta semana. Prueba ${sugerencia}.`} />
        <View style={estilos.botones}>
          <Button
            mode="contained"
            onPress={onSemanaSiguiente}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ver las franjas de la semana siguiente"
          >
            Ver la semana siguiente
          </Button>
          {onOtroTema ? (
            <Button
              mode="outlined"
              onPress={onOtroTema}
              style={estilos.boton}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Elegir otro tema de asesoría"
            >
              Elegir otro tema
            </Button>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.lista}>
      {dias.map(({ fecha, franjas: delDia }) => (
        <View key={fecha} style={estilos.dia}>
          <Text variant="titleSmall" style={estilos.tituloDia} accessibilityRole="header">
            {fechaCompleta(fecha)}
          </Text>
          <View style={estilos.botones}>
            {delDia.map((franja) => {
              const horas = `${franja.horaInicio} – ${franja.horaFin}`;
              const cupos = textoCupos(franja.cuposLibres);
              return (
                <Button
                  key={franja.id}
                  mode="outlined"
                  onPress={() => onElegir(franja)}
                  style={estilos.boton}
                  contentStyle={estilos.contenidoBoton}
                  labelStyle={estilos.textoBoton}
                  accessibilityRole="button"
                  accessibilityLabel={`${fechaCompleta(fecha)}, de ${franja.horaInicio} a ${franja.horaFin}, ${cupos}. Elegir`}
                >
                  {`${horas} · ${cupos}`}
                </Button>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.l },
  dia: { gap: espacio.s },
  tituloDia: { color: colores.texto, fontFamily: fuentes.seminegrita },
  vacio: { gap: espacio.m },
  // Los botones se reparten la fila y, con letra grande, pasan a la siguiente.
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
