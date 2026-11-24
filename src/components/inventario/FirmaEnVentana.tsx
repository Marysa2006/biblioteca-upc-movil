/**
 * Firma en una ventana a pantalla completa (revisión de la 1.1). En el formulario, dentro de la
 * lista que se desplaza, Android se llevaba los trazos verticales y la firma quedaba cortada. Aquí
 * el formulario solo muestra la firma (o "Sin firmar") y el botón Firmar; el recuadro abre en un
 * Modal sin desplazamiento y más grande. "Listo" guarda la firma; "Cancelar" deja la anterior.
 * La usan la entrega de una tablet (el usuario) y el Perfil del personal (su firma registrada).
 */
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { FirmaElectronica } from '@/types';
import { esFirmaValida, fechaHoraLegible } from '@/utils/prestamos';

import { PanelFirma } from './PanelFirma';

type Props = {
  /** Quién firma: «Carlos Ramírez», o «tu firma» en el Perfil. */
  firmante: string;
  valor: FirmaElectronica | null;
  onCambiar: (firma: FirmaElectronica | null) => void;
  mensajeError?: string;
  deshabilitado?: boolean;
};

/** La firma ya hecha, de solo lectura, con su proporción. */
export function VistaFirma({ firma, alto }: { firma: FirmaElectronica; alto?: boolean }) {
  return (
    <View style={[estilos.vista, alto ? estilos.vistaAlta : null]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${firma.ancho} ${firma.alto}`}>
        <Path
          d={firma.trazo}
          stroke={colores.texto}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function FirmaEnVentana({ firmante, valor, onCambiar, mensajeError, deshabilitado }: Props) {
  const [abierta, setAbierta] = useState(false);
  const [borrador, setBorrador] = useState<FirmaElectronica | null>(null);
  const firma = esFirmaValida(valor ?? undefined) ? valor : null;

  const abrir = () => {
    setBorrador(null);
    setAbierta(true);
  };

  return (
    <View style={estilos.grupo}>
      <Text variant="titleSmall" style={estilos.titulo}>
        {`Firma de ${firmante}`}
      </Text>
      {firma ? (
        <>
          <VistaFirma firma={firma} />
          <Text variant="bodySmall" style={estilos.ayuda}>
            {`Firmada el ${fechaHoraLegible(firma.fechaHora)}`}
          </Text>
        </>
      ) : (
        <Text variant="bodySmall" style={estilos.ayuda}>
          Sin firmar. Toca Firmar y pásale el celular a la persona.
        </Text>
      )}
      <Button
        mode={firma ? 'outlined' : 'contained-tonal'}
        icon="draw"
        onPress={abrir}
        disabled={deshabilitado}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={firma ? `Volver a firmar: ${firmante}` : `Firmar: ${firmante}`}
      >
        {firma ? 'Volver a firmar' : 'Firmar'}
      </Button>
      <View accessibilityLiveRegion="polite">
        <HelperText type="error" visible={mensajeError != null}>
          {mensajeError ?? ''}
        </HelperText>
      </View>

      <Modal
        visible={abierta}
        animationType="slide"
        onRequestClose={() => setAbierta(false)}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={estilos.ventana}>
          <View style={estilos.contenidoVentana}>
            <PanelFirma firmante={firmante} valor={borrador} onCambiar={setBorrador} alto />
          </View>
          <View style={estilos.acciones}>
            <Button
              mode="text"
              onPress={() => setAbierta(false)}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Cancelar y dejar la firma como estaba"
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              icon="check"
              onPress={() => {
                onCambiar(borrador);
                setAbierta(false);
              }}
              disabled={!borrador}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Listo: guardar la firma"
            >
              Listo
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  // La firma de solo lectura, con la proporción del panel donde se hizo.
  vista: {
    width: '100%',
    aspectRatio: 2.4,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  vistaAlta: { aspectRatio: 1.6 },
  boton: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
  ventana: { flex: 1, backgroundColor: colores.fondo },
  contenidoVentana: { flex: 1, justifyContent: 'center', padding: espacio.l },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espacio.s,
    padding: espacio.l,
  },
});
