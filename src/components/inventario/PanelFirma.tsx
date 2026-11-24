/**
 * Panel para firmar con el dedo (#310): la firma electrónica del usuario responsable en la
 * entrega de una tablet. Sin paquetes nuevos: las props de respuesta táctil de la View leen el dedo y
 * `react-native-svg` dibuja los trazos. Al soltar, entrega la firma como un `path` SVG con las
 * medidas del panel (FirmaElectronica), que el PDF dibuja igual.
 *
 * Dentro del ScrollView de Pantalla: el panel toma el gesto y no lo suelta mientras se firma
 * (onResponderTerminationRequest), así la pantalla no se desplaza.
 * Quien no puede firmar con el dedo (por ejemplo, con lector de pantalla) elige firmar en papel
 * en el formulario: la constancia impresa trae el recuadro en blanco.
 */
import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { FirmaElectronica } from '@/types';
import { fechaHoraLegible } from '@/utils/prestamos';
import { ahoraFechaHora } from '@/utils/tablets';

type Props = {
  /** Quién firma, para la etiqueta y el lector: «Firma de Carlos Ramírez». */
  firmante: string;
  valor: FirmaElectronica | null;
  onCambiar: (firma: FirmaElectronica | null) => void;
  mensajeError?: string;
  deshabilitado?: boolean;
  /** Recuadro más alto, para la ventana a pantalla completa (FirmaEnVentana). */
  alto?: boolean;
};

/** Un decimal: la firma pesa poco y se ve igual. */
const punto = (evento: GestureResponderEvent) =>
  `${Math.round(evento.nativeEvent.locationX * 10) / 10} ${Math.round(evento.nativeEvent.locationY * 10) / 10}`;

export function PanelFirma({
  firmante,
  valor,
  onCambiar,
  mensajeError,
  deshabilitado,
  alto = false,
}: Props) {
  const [medidas, setMedidas] = useState({ ancho: 0, alto: 0 });
  // Los trazos que se ven mientras se firma; al soltar se entregan a quien usa el panel.
  const [trazo, setTrazo] = useState(valor?.trazo ?? '');
  // El trazo se arma en un ref (cada movimiento) y se copia al estado para dibujarlo.
  const trazoActual = useRef(valor?.trazo ?? '');

  const respuesta = {
    onStartShouldSetResponder: () => !deshabilitado,
    onMoveShouldSetResponder: () => !deshabilitado,
    // Mientras se firma, el ScrollView no se lleva el gesto.
    onResponderTerminationRequest: () => false,
    onResponderGrant: (evento: GestureResponderEvent) => {
      trazoActual.current = `${trazoActual.current} M${punto(evento)}`.trim();
      setTrazo(trazoActual.current);
    },
    onResponderMove: (evento: GestureResponderEvent) => {
      trazoActual.current = `${trazoActual.current} L${punto(evento)}`;
      setTrazo(trazoActual.current);
    },
    onResponderRelease: () => {
      // Un toque sin moverse no es una firma: sin «L» no se entrega.
      if (!trazoActual.current.includes('L')) return;
      onCambiar({
        trazo: trazoActual.current,
        ancho: Math.round(medidas.ancho),
        alto: Math.round(medidas.alto),
        fechaHora: ahoraFechaHora(),
      });
    },
  };

  const borrar = () => {
    trazoActual.current = '';
    setTrazo('');
    onCambiar(null);
  };

  return (
    <View style={estilos.grupo}>
      <Text variant="titleSmall" style={estilos.titulo}>
        {`Firma de ${firmante}`}
      </Text>
      <Text variant="bodySmall" style={estilos.ayuda}>
        Pídele a la persona que firme con el dedo dentro del recuadro.
      </Text>
      <View
        style={[estilos.panel, alto ? estilos.panelAlto : null, mensajeError ? estilos.panelError : null]}
        onLayout={(evento: LayoutChangeEvent) =>
          setMedidas({
            ancho: evento.nativeEvent.layout.width,
            alto: evento.nativeEvent.layout.height,
          })
        }
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          valor
            ? `Firma de ${firmante}, hecha el ${fechaHoraLegible(valor.fechaHora)}`
            : `Recuadro para la firma de ${firmante}, todavía sin firmar`
        }
        {...respuesta}
      >
        {medidas.ancho > 0 ? (
          <Svg width={medidas.ancho} height={medidas.alto}>
            {trazo ? (
              <Path
                d={trazo}
                stroke={colores.texto}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>
        ) : null}
        {/* La línea de la firma, como en el papel. */}
        <View style={estilos.linea} pointerEvents="none" />
      </View>
      <View style={estilos.pie}>
        <Text variant="bodySmall" style={estilos.ayuda}>
          {valor ? `Firmada el ${fechaHoraLegible(valor.fechaHora)}` : 'Sin firmar'}
        </Text>
        <Button
          mode="text"
          icon="eraser"
          onPress={borrar}
          disabled={deshabilitado || !trazo}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Borrar la firma de ${firmante} para firmar de nuevo`}
        >
          Borrar
        </Button>
      </View>
      <View accessibilityLiveRegion="polite">
        <HelperText type="error" visible={mensajeError != null}>
          {mensajeError ?? ''}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  // Ancho completo y alto proporcional: crece con la pantalla, no con la letra.
  panel: {
    width: '100%',
    aspectRatio: 2.4,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  panelAlto: { aspectRatio: 1.6 },
  panelError: { borderColor: colores.error },
  linea: {
    position: 'absolute',
    left: espacio.l,
    right: espacio.l,
    bottom: espacio.l,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  contenidoBoton: { paddingVertical: espacio.xs },
});
