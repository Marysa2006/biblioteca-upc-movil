/**
 * Formulario por pasos para las solicitudes de la comunidad (#251): asesoría, capacitación y
 * reserva van en Solicitud · Tus datos · Términos.
 * - Arriba, "Paso 1 de 3" con el nombre del paso y una barra de tramos (decorativa: el texto ya
 *   dice en qué paso se va). Al cambiar de paso, la pantalla vuelve arriba y el lector lo anuncia.
 * - Abajo, "Anterior" desde el segundo paso y "Siguiente" hasta el penúltimo, en la misma fila.
 *   "Enviar" solo aparece en el último, para que nadie envíe sin ver sus datos ni los términos, y
 *   se deshabilita con su motivo mientras falten los términos (`puedeEnviar`).
 * No sabe de datos ni de validación: el formulario decide si avanza (por ejemplo, con `trigger()`
 * de los campos del paso, ver src/utils/pasos.ts).
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

import { useSubirAlInicio } from './Pantalla';

export type PasoFormulario<T extends string> = { valor: T; etiqueta: string };

type Props<T extends string> = {
  pasos: readonly PasoFormulario<T>[];
  paso: T;
  onAnterior: () => void;
  onSiguiente: () => void;
  onEnviar: () => void;
  enviando: boolean;
  /** Lo que dice el lector del botón Enviar, por ejemplo "Enviar la solicitud de asesoría". */
  etiquetaEnviar: string;
  /**
   * false mientras falte algo que se ve en el último paso (los términos sin aceptar): Enviar se
   * deshabilita y debajo se dice por qué (`motivoSinEnviar`).
   */
  puedeEnviar?: boolean;
  motivoSinEnviar?: string;
  /** Avisos que van justo encima de los botones (por ejemplo, el error de la API). */
  avisos?: ReactNode;
  children: ReactNode;
};

export function PasosFormulario<T extends string>({
  pasos,
  paso,
  onAnterior,
  onSiguiente,
  onEnviar,
  enviando,
  etiquetaEnviar,
  puedeEnviar = true,
  motivoSinEnviar = 'Marca la casilla para enviar la solicitud.',
  avisos,
  children,
}: Props<T>) {
  const subirAlInicio = useSubirAlInicio();
  const indice = Math.max(
    0,
    pasos.findIndex(({ valor }) => valor === paso),
  );
  const actual = pasos[indice];
  const siguiente = pasos[indice + 1];
  const titulo = `Paso ${indice + 1} de ${pasos.length}: ${actual.etiqueta}`;

  // Al cambiar de paso (no al abrir el formulario): arriba, y en iOS se anuncia el paso nuevo.
  const primero = useRef(true);
  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    subirAlInicio();
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(titulo);
  }, [paso, subirAlInicio, titulo]);

  return (
    <View style={estilos.formulario}>
      <View
        style={estilos.encabezado}
        accessible
        accessibilityRole="header"
        accessibilityLabel={titulo}
        // En Android, el cambio de paso se anuncia al aparecer.
        accessibilityLiveRegion="polite"
      >
        <Text variant="labelMedium" style={estilos.numero}>
          {`Paso ${indice + 1} de ${pasos.length}`}
        </Text>
        <Text variant="titleMedium" style={estilos.titulo}>
          {actual.etiqueta}
        </Text>
        <View style={estilos.barra}>
          {pasos.map(({ valor }, posicion) => (
            <View
              key={valor}
              style={[estilos.tramo, posicion <= indice ? estilos.tramoHecho : null]}
            />
          ))}
        </View>
      </View>

      {children}

      {avisos}

      <View style={estilos.botones}>
        {indice > 0 ? (
          <Button
            mode="outlined"
            icon="arrow-left"
            onPress={onAnterior}
            disabled={enviando}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Anterior: ${pasos[indice - 1].etiqueta}`}
          >
            Anterior
          </Button>
        ) : null}
        {siguiente ? (
          <Button
            mode="contained"
            icon="arrow-right"
            onPress={onSiguiente}
            disabled={enviando}
            style={estilos.boton}
            contentStyle={estilos.contenidoSiguiente}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            // El encabezado ya dice el paso: el botón queda corto y cabe junto a Anterior.
            accessibilityLabel={`Siguiente: ${siguiente.etiqueta}`}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            mode="contained"
            icon="send-outline"
            onPress={onEnviar}
            loading={enviando}
            disabled={enviando || !puedeEnviar}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={etiquetaEnviar}
            accessibilityHint={puedeEnviar ? undefined : motivoSinEnviar}
          >
            Enviar solicitud
          </Button>
        )}
      </View>
      {!siguiente && !puedeEnviar ? (
        <Text variant="bodySmall" style={estilos.motivo}>
          {motivoSinEnviar}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  encabezado: { gap: espacio.xs },
  numero: { color: colores.textoSecundario },
  titulo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  barra: { flexDirection: 'row', gap: espacio.xs, marginTop: espacio.xs },
  tramo: {
    flex: 1,
    height: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.bordeFuerte,
  },
  tramoHecho: { backgroundColor: colores.primario },
  // Anterior y Siguiente (o Enviar) van en la misma fila y del mismo ancho.
  botones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1, flexBasis: '40%' },
  motivo: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  // row-reverse deja la flecha a la derecha del texto.
  contenidoSiguiente: { flexDirection: 'row-reverse', paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
