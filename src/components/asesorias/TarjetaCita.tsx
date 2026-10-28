/**
 * Tarjeta de una cita de asesoría en Mis citas (HU-14): tema y estado, cuándo, con quién y
 * qué se pidió.
 * - Dentro del plazo, "Reprogramar" y "Cancelar" (CA3).
 * - Fuera del plazo, explica cuántas horas antes se podía (horasMinimasCancelacion, HU-28).
 * - Ya resuelta, muestra el motivo o el resultado si lo hay.
 * No se presiona entera: cada acción es su propio botón.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import { citaEnCurso, puedeCancelarCita, textoPlazoCancelacion } from '@/utils/asesorias';
import { fechaCompleta } from '@/utils/calendario';

type Props = {
  cita: Cita;
  /** parametros.horasMinimasCancelacion (HU-28). */
  horasCancelacion: number;
  onCancelar: (cita: Cita) => void;
  onReprogramar: (cita: Cita) => void;
};

export function TarjetaCita({ cita, horasCancelacion, onCancelar, onReprogramar }: Props) {
  const cuando = `${fechaCompleta(cita.fecha)} · ${cita.horaInicio} – ${cita.horaFin}`;
  const puedeCambiar = puedeCancelarCita(cita, horasCancelacion);
  const fueraDePlazo = citaEnCurso(cita) && !puedeCambiar;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="labelMedium" style={estilos.tipo}>
          Asesoría
        </Text>
        <EtiquetaEstado estado={cita.estado} />
      </View>

      <View style={estilos.textos}>
        <Text variant="titleMedium" style={estilos.titulo}>
          {cita.tema}
        </Text>
        <Text variant="bodyMedium" style={estilos.secundario}>
          {`Con ${cita.facilitador}`}
        </Text>
      </View>

      <View style={estilos.detalle}>
        <Text variant="bodyMedium" style={estilos.dato}>
          {cuando}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {cita.necesidad}
        </Text>
      </View>

      {cita.motivo ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Motivo: ${cita.motivo}`}
        </Text>
      ) : null}
      {cita.resultado ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Resultado: ${cita.resultado}`}
        </Text>
      ) : null}

      {fueraDePlazo ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {textoPlazoCancelacion(horasCancelacion)}
        </Text>
      ) : null}

      {puedeCambiar ? (
        <View style={estilos.acciones}>
          <Button
            mode="contained-tonal"
            onPress={() => onReprogramar(cita)}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Reprogramar la asesoría de ${cita.tema} del ${cuando}`}
          >
            Reprogramar
          </Button>
          <Button
            mode="outlined"
            onPress={() => onCancelar(cita)}
            textColor={coloresEstado.rechazada.texto}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Cancelar la asesoría de ${cita.tema} del ${cuando}`}
          >
            Cancelar
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  // Con letra grande, la etiqueta del estado baja a la línea siguiente.
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  tipo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  textos: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  detalle: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  // Los botones se reparten la fila y, con letra grande, pasan a la siguiente.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
