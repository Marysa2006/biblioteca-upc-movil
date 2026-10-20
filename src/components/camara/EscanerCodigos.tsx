/**
 * Escáner de códigos con la cámara (spike de cámara, iteración 2). Pensado para reutilizarse
 * en HU-31 (código de barras de tablets) y HU-32/HU-33 (asistencia con QR).
 *
 * - Pide el permiso de cámara y explica para qué; si el usuario lo negó para siempre, lleva a
 *   los ajustes del celular (HU-32, CA4).
 * - Después de cada lectura se pausa hasta "Escanear otro", para no leer el mismo código varias
 *   veces seguidas (HU-32, CA3).
 * - La cámara se apaga cuando la pantalla deja de verse: solo puede haber una vista previa
 *   activa a la vez (documentación de expo-camera, SDK 57).
 */
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, Icon, IconButton, Text } from 'react-native-paper';

import { EstadoCarga } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';

export type LecturaCodigo = {
  tipo: string;
  datos: string;
  /** Milisegundos desde que la cámara quedó lista hasta la lectura. */
  demoraMs: number | null;
};

type Props = {
  tipos: BarcodeType[];
  onLeido: (lectura: LecturaCodigo) => void;
};

export function EscanerCodigos({ tipos, onLeido }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const enFoco = useIsFocused();
  const [pausado, setPausado] = useState(false);
  const [linterna, setLinterna] = useState(false);
  const lista = useRef<number | null>(null);

  if (!permiso) return <EstadoCarga mensaje="Revisando el permiso de la cámara…" />;

  if (!permiso.granted) {
    return (
      <View style={estilos.aviso}>
        <Icon source="camera-off-outline" size={40} color={colores.textoSecundario} />
        <Text variant="bodyMedium" style={estilos.textoAviso}>
          La app usa la cámara solo para leer códigos QR y códigos de barras. No toma fotos ni
          graba.
        </Text>
        {permiso.canAskAgain ? (
          <Button
            mode="contained"
            icon="camera-outline"
            onPress={pedirPermiso}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Permitir el uso de la cámara"
          >
            Permitir cámara
          </Button>
        ) : (
          <>
            <Text variant="bodyMedium" style={estilos.textoAviso}>
              El permiso está negado. Actívalo en Ajustes → Aplicaciones → Expo Go → Permisos →
              Cámara.
            </Text>
            <Button
              mode="contained"
              icon="cog-outline"
              onPress={() => Linking.openSettings()}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Abrir los ajustes del celular para activar la cámara"
            >
              Abrir ajustes
            </Button>
          </>
        )}
      </View>
    );
  }

  const leer = (resultado: BarcodeScanningResult) => {
    setPausado(true);
    onLeido({
      tipo: resultado.type,
      datos: resultado.data,
      demoraMs: lista.current ? Date.now() - lista.current : null,
    });
  };

  const escanearOtro = () => {
    lista.current = Date.now();
    setPausado(false);
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.marco}>
        {enFoco ? (
          <CameraView
            style={estilos.camara}
            facing="back"
            enableTorch={linterna}
            barcodeScannerSettings={{ barcodeTypes: tipos }}
            onCameraReady={() => {
              lista.current = Date.now();
            }}
            // Sin callback no se procesan códigos: así se pausa la lectura.
            onBarcodeScanned={pausado ? undefined : leer}
          />
        ) : null}
        {pausado ? (
          <View style={estilos.capaPausa}>
            <Icon source="check-circle-outline" size={48} color={colores.superficie} />
            <Text variant="titleMedium" style={estilos.textoPausa}>
              Código leído
            </Text>
          </View>
        ) : (
          <View style={estilos.guia} pointerEvents="none" />
        )}
      </View>

      <View style={estilos.acciones}>
        <Button
          mode="contained"
          icon="barcode-scan"
          onPress={escanearOtro}
          disabled={!pausado}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Escanear otro código"
        >
          Escanear otro
        </Button>
        <IconButton
          icon={linterna ? 'flashlight-off' : 'flashlight'}
          mode="contained-tonal"
          size={24}
          onPress={() => setLinterna((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: linterna }}
          accessibilityLabel={linterna ? 'Apagar la linterna' : 'Encender la linterna'}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s },
  marco: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radio.tarjeta,
    overflow: 'hidden',
    backgroundColor: colores.texto,
  },
  camara: { flex: 1 },
  // Recuadro que indica dónde poner el código.
  guia: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    bottom: '20%',
    borderWidth: 3,
    borderColor: colores.verdeClaroUpc,
    borderRadius: radio.tarjeta,
  },
  capaPausa: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.s,
    // primarioOscuro al 85 % (D9 en hexadecimal), para que se adivine la imagen detrás.
    backgroundColor: `${colores.primarioOscuro}D9`,
  },
  textoPausa: { color: colores.superficie, fontFamily: fuentes.negrita },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  aviso: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.l },
  textoAviso: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
