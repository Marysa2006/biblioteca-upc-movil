/**
 * Escáner de códigos del sistema (HU-31), como recomendó el spike de cámara
 * (docs/spike-camara.md): en Android abre el escáner de Google, que se cierra solo al leer; en
 * iOS, el de DataScanner, que se cierra aquí (documentación de expo-camera, SDK 58).
 *
 *   const escaner = useEscanerSistema((codigo) => buscar(codigo));
 *   if (!(await escaner.abrir())) abrirCamaraDeLaApp();
 *
 * `abrir()` devuelve false si el celular no tiene escáner del sistema o no se pudo abrir: en
 * ese caso se usa la cámara dentro de la app (EscanerCodigos).
 */
import { CameraView, type BarcodeType } from 'expo-camera';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/** Códigos de barras comunes en etiquetas de inventario (los mismos del spike). */
export const TIPOS_BARRAS: BarcodeType[] = [
  'code128',
  'code39',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'itf14',
  'codabar',
];

export function useEscanerSistema(onLeido: (codigo: string) => void) {
  // El escáner avisa por un evento global: solo se atiende si lo abrió este hook.
  const esperando = useRef(false);
  const alLeer = useRef(onLeido);
  const disponible = Platform.OS !== 'web' && CameraView.isModernBarcodeScannerAvailable;

  useEffect(() => {
    alLeer.current = onLeido;
  }, [onLeido]);

  useEffect(() => {
    if (!disponible) return;
    const suscripcion = CameraView.onModernBarcodeScanned((resultado) => {
      if (!esperando.current) return;
      esperando.current = false;
      if (Platform.OS === 'ios') void CameraView.dismissScanner();
      alLeer.current(resultado.data);
    });
    return () => suscripcion.remove();
  }, [disponible]);

  const abrir = async (): Promise<boolean> => {
    if (!disponible) return false;
    try {
      esperando.current = true;
      await CameraView.launchScanner({ barcodeTypes: TIPOS_BARRAS });
      return true;
    } catch {
      esperando.current = false;
      return false;
    }
  };

  return { disponible, abrir };
}
