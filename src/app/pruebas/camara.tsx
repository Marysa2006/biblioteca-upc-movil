/**
 * Spike de cámara (iteración 2, chore/spike-camara): prueba en Expo Go la lectura de QR y
 * códigos de barras antes de necesitarla en HU-31 (tablets) y HU-32/HU-33 (asistencia con QR).
 * Solo existe en desarrollo (__DEV__): en el APK muestra un aviso y no abre la cámara.
 *
 * Compara dos formas de leer:
 * - Cámara dentro de la app (CameraView + onBarcodeScanned), con nuestro diseño.
 * - Escáner del sistema (CameraView.launchScanner): en Android, el escáner de Google.
 * Y prueba el plan B de HU-31 (CA3): escribir el código a mano.
 * Los resultados se anotan en docs/spike-camara.md.
 */
import { CameraView, type BarcodeType } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { EscanerCodigos, type LecturaCodigo } from '@/components/camara/EscanerCodigos';
import { AvisoError, EncabezadoApilado, EstadoVacio, Pantalla } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';

type GrupoTipos = 'qr' | 'barras' | 'todos';

/** QR para asistencia (HU-32/33); códigos de barras comunes en etiquetas de inventario (HU-31). */
const TIPOS: Record<GrupoTipos, BarcodeType[]> = {
  qr: ['qr'],
  barras: ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'codabar'],
  todos: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'itf14', 'codabar', 'datamatrix', 'pdf417'],
};

type Origen = 'cámara' | 'escáner del sistema' | 'a mano';
type Registro = LecturaCodigo & { id: number; origen: Origen; hora: string };

const MAXIMO_REGISTROS = 10;

function horaActual(): string {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function PruebaCamara() {
  return (
    <>
      <EncabezadoApilado titulo="Prueba de cámara" />
      <Pantalla
        titulo="Prueba de cámara"
        subtitulo="Spike: lectura de QR y códigos de barras en Expo Go."
        conEncabezado
        conTeclado
      >
        {__DEV__ ? (
          <Prueba />
        ) : (
          <EstadoVacio mensaje="Esta prueba solo está disponible en desarrollo." />
        )}
      </Pantalla>
    </>
  );
}

function Prueba() {
  const [grupo, setGrupo] = useState<GrupoTipos>('todos');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [manual, setManual] = useState('');
  const [errorSistema, setErrorSistema] = useState<string | null>(null);

  const agregar = (lectura: LecturaCodigo, origen: Origen) =>
    setRegistros((actuales) =>
      [{ ...lectura, origen, id: Date.now(), hora: horaActual() }, ...actuales].slice(0, MAXIMO_REGISTROS),
    );

  // El escáner del sistema avisa por un evento, no por una promesa.
  useEffect(() => {
    if (!CameraView.isModernBarcodeScannerAvailable) return;
    const suscripcion = CameraView.onModernBarcodeScanned((resultado) =>
      agregar({ tipo: resultado.type, datos: resultado.data, demoraMs: null }, 'escáner del sistema'),
    );
    return () => suscripcion.remove();
  }, []);

  const abrirEscanerSistema = async () => {
    setErrorSistema(null);
    try {
      await CameraView.launchScanner({ barcodeTypes: TIPOS[grupo] });
    } catch (error) {
      setErrorSistema(`No se pudo abrir el escáner del sistema: ${String(error)}`);
    }
  };

  const registrarManual = () => {
    const codigo = manual.trim();
    if (!codigo) return;
    agregar({ tipo: 'manual', datos: codigo, demoraMs: null }, 'a mano');
    setManual('');
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.grupo}>
        <Text variant="titleSmall" style={estilos.titulo}>
          1. Cámara dentro de la app
        </Text>
        <SegmentedButtons
          value={grupo}
          onValueChange={(valor) => setGrupo(valor as GrupoTipos)}
          buttons={[
            { value: 'qr', label: 'QR', icon: 'qrcode' },
            { value: 'barras', label: 'Barras', icon: 'barcode' },
            { value: 'todos', label: 'Todos', icon: 'scan-helper' },
          ]}
        />
        {/* key: al cambiar los tipos se vuelve a montar la cámara con la nueva configuración. */}
        <EscanerCodigos key={grupo} tipos={TIPOS[grupo]} onLeido={(lectura) => agregar(lectura, 'cámara')} />
      </View>

      <View style={estilos.grupo}>
        <Text variant="titleSmall" style={estilos.titulo}>
          2. Escáner del sistema
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {CameraView.isModernBarcodeScannerAvailable
            ? `Disponible en este celular (${Platform.OS === 'android' ? 'escáner de Google' : 'DataScanner de iOS'}). Se cierra solo al leer.`
            : 'No disponible en este celular.'}
        </Text>
        <Button
          mode="contained-tonal"
          icon="line-scan"
          onPress={abrirEscanerSistema}
          disabled={!CameraView.isModernBarcodeScannerAvailable}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Abrir el escáner del sistema"
        >
          Abrir escáner del sistema
        </Button>
        {errorSistema ? <AvisoError mensaje={errorSistema} /> : null}
      </View>

      <View style={estilos.grupo}>
        <Text variant="titleSmall" style={estilos.titulo}>
          3. Plan B: escribir el código
        </Text>
        <TextInput
          mode="outlined"
          label="Código"
          placeholder="Por ejemplo: TAB-0012"
          value={manual}
          onChangeText={setManual}
          autoCapitalize="characters"
          onSubmitEditing={registrarManual}
          accessibilityLabel="Escribir el código a mano"
        />
        <Button
          mode="outlined"
          icon="keyboard-outline"
          onPress={registrarManual}
          disabled={manual.trim() === ''}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Registrar el código escrito"
        >
          Registrar
        </Button>
      </View>

      <View style={estilos.grupo}>
        <Text variant="titleSmall" style={estilos.titulo}>
          Lecturas
        </Text>
        {registros.length === 0 ? (
          <EstadoVacio mensaje="Todavía no hay lecturas. Apunta la cámara a un código." />
        ) : (
          registros.map((registro) => (
            <View key={registro.id} style={estilos.registro} accessible>
              <Text variant="labelLarge" style={estilos.datos} selectable>
                {registro.datos}
              </Text>
              <Text variant="bodySmall" style={estilos.secundario}>
                {[
                  registro.tipo,
                  registro.origen,
                  registro.hora,
                  registro.demoraMs != null ? `${(registro.demoraMs / 1000).toFixed(1)} s` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.l },
  grupo: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  registro: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  datos: { color: colores.texto, fontFamily: fuentes.seminegrita },
  contenidoBoton: { paddingVertical: espacio.xs },
});
