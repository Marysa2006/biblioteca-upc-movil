/**
 * QR temporal de la asistencia (HU-33, CA1): solo sirve para esta sesión y hasta que vence.
 * Lleva el texto que arma armarCodigoAsistencia() (#192): la sesión y el código, para que quien
 * escanea (HU-32) sepa de qué sesión es. Debajo, el código en números y el tiempo que le queda.
 * Si vence, el QR se atenúa y se ofrece generar otro.
 */
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { CodigoAsistencia } from '@/types';
import { armarCodigoAsistencia, textoVencimiento } from '@/utils/asistencia';

/** El QR no pasa de este tamaño aunque la pantalla sea grande. */
const TAMANO_MAXIMO = espacio.xl * 8;

type Props = {
  codigo: CodigoAsistencia;
  minutosRestantes: number;
  generando: boolean;
  onGenerar: () => void;
};

export function QrAsistencia({ codigo, minutosRestantes, generando, onGenerar }: Props) {
  const { width } = useWindowDimensions();
  const tamano = Math.min(width - espacio.xl * 4, TAMANO_MAXIMO);
  const vencido = minutosRestantes <= 0;
  const vencimiento = textoVencimiento(minutosRestantes);

  return (
    <View style={estilos.tarjeta}>
      <View
        style={[estilos.qr, vencido ? estilos.qrVencido : null]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Código QR de la asistencia. Código ${codigo.codigo.split('').join(' ')}. ${vencimiento}.`}
      >
        <QRCode
          value={armarCodigoAsistencia(codigo.sesionId, codigo.codigo)}
          size={tamano}
          color={colores.texto}
          backgroundColor={colores.superficie}
          quietZone={espacio.s}
          ecl="M"
        />
      </View>

      <Text variant="headlineMedium" style={estilos.codigo} accessibilityElementsHidden>
        {codigo.codigo}
      </Text>
      <Text
        variant="bodyMedium"
        style={vencido ? estilos.vencido : estilos.vigente}
        accessibilityLiveRegion="polite"
      >
        {vencido
          ? `${vencimiento}: ya no acepta registros.`
          : `${vencimiento}. Muéstralo para que lo escaneen.`}
      </Text>

      {vencido ? (
        <Button
          mode="contained"
          icon="refresh"
          onPress={onGenerar}
          loading={generando}
          disabled={generando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Generar otro código de asistencia"
        >
          Generar otro código
        </Button>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.l,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  qr: { borderRadius: radio.boton, overflow: 'hidden' },
  qrVencido: { opacity: 0.25 },
  // Espaciado entre números para leerlo en voz alta o copiarlo sin confundirse.
  codigo: { color: colores.texto, fontFamily: fuentes.negrita, letterSpacing: espacio.xs },
  vigente: { color: colores.textoSecundario, textAlign: 'center' },
  vencido: { color: colores.error, fontFamily: fuentes.seminegrita, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
