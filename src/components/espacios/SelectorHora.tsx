/**
 * Reloj de horas en punto (HU-20): una grilla de botones con las horas que se pueden elegir.
 * Las que no sirven (ya pasaron, bloqueadas o fuera del horario) se ven desactivadas y el
 * lector de pantalla dice por qué. Entrega la hora como texto 'HH:MM'.
 */
import { StyleSheet, View } from 'react-native';
import { HelperText, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { OpcionHora } from '@/utils/bloqueos';

type Props = {
  etiqueta: string;
  opciones: OpcionHora[];
  /** 'HH:MM' o vacío. */
  valor: string;
  onCambiar: (hora: string) => void;
  /** Se muestra en vez de la grilla cuando no hay opciones (por ejemplo, falta la fecha). */
  sinOpciones: string;
  mensajeError?: string;
  deshabilitado?: boolean;
};

export function SelectorHora({
  etiqueta,
  opciones,
  valor,
  onCambiar,
  sinOpciones,
  mensajeError,
  deshabilitado = false,
}: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text variant="labelLarge" style={estilos.etiqueta}>
        {etiqueta}
      </Text>

      {opciones.length === 0 ? (
        <Text variant="bodyMedium" style={estilos.sinOpciones}>
          {sinOpciones}
        </Text>
      ) : (
        <View style={estilos.grilla} accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
          {opciones.map((opcion) => {
            const elegida = opcion.hora === valor;
            const bloqueada = deshabilitado || opcion.motivo != null;
            return (
              <View
                key={opcion.hora}
                style={[
                  estilos.hora,
                  elegida ? estilos.horaElegida : bloqueada ? estilos.horaBloqueada : estilos.horaLibre,
                ]}
              >
                <TouchableRipple
                  onPress={() => onCambiar(opcion.hora)}
                  disabled={bloqueada}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: elegida, disabled: bloqueada }}
                  accessibilityLabel={`${opcion.hora}${opcion.motivo ? `, no disponible: ${opcion.motivo}` : ''}`}
                >
                  <View style={estilos.contenidoHora}>
                    <Text
                      variant="labelLarge"
                      style={
                        elegida
                          ? estilos.textoElegido
                          : opcion.motivo
                            ? estilos.textoBloqueado
                            : estilos.textoLibre
                      }
                    >
                      {opcion.hora}
                    </Text>
                  </View>
                </TouchableRipple>
              </View>
            );
          })}
        </View>
      )}

      <HelperText type="error" visible={mensajeError != null}>
        {mensajeError ?? ''}
      </HelperText>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s },
  etiqueta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  sinOpciones: { color: colores.textoSecundario },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  hora: { borderRadius: radio.boton, overflow: 'hidden', borderWidth: 1 },
  horaLibre: { backgroundColor: colores.primarioSuave, borderColor: colores.primarioSuave },
  horaElegida: { backgroundColor: colores.primario, borderColor: colores.primario },
  horaBloqueada: { backgroundColor: colores.superficieVariante, borderColor: colores.borde },
  // 44 × 72: área táctil cómoda para el dedo.
  contenidoHora: { minHeight: 44, minWidth: 72, alignItems: 'center', justifyContent: 'center' },
  textoLibre: { color: colores.primarioOscuro },
  textoElegido: { color: colores.superficie, fontFamily: fuentes.negrita },
  textoBloqueado: { color: colores.textoSecundario, textDecorationLine: 'line-through' },
});
