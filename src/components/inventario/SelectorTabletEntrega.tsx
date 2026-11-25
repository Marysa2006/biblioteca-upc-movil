/**
 * Qué tablet se entrega (#310). La tablet se asigna al entregarla, como en el Backend: se elige
 * de la lista de las que están libres toda la franja del préstamo, o se escanea su código.
 * Escanear abre la cámara de la app (EscanerCodigos), que pide el permiso; no el escáner de Google.
 * Lo escaneado se revisa con `asignarTabletAlEntregar()`; si no sirve, el aviso dice por qué.
 * La pantalla recibe la tablet elegida y si se leyó con la cámara (para "Verificada").
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { EscanerCodigos } from '@/components/camara/EscanerCodigos';
import { AvisoError, CampoDesplegable } from '@/components/ui';
import { TIPOS_BARRAS } from '@/hooks/useEscanerSistema';
import { useBuscarTabletPorCodigo } from '@/hooks/useTablets';
import { espacio } from '@/theme';
import type { Prestamo, Tablet } from '@/types';
import { asignarTabletAlEntregar } from '@/utils/tablets';

type Props = {
  prestamo: Prestamo;
  /** Todo el inventario y todos los préstamos, para revisar lo escaneado. */
  tablets: Tablet[];
  prestamos: Prestamo[];
  /** Las que se pueden entregar en este préstamo (`tabletsParaEntregar()`). */
  opciones: Tablet[];
  /** La tablet elegida; '' sin elegir. */
  valor: string;
  onElegir: (tabletId: string, escaneada: boolean) => void;
};

const nombreOpcion = (tablet: Tablet) => `${tablet.codigo} · ${tablet.modelo}`;

/** El mensaje de la API si el código no sirve (400 o 404); si no, uno de conexión. */
function mensajeBusqueda(error: Error): string {
  if ('estado' in error && (error.estado === 400 || error.estado === 404)) return error.message;
  return 'No pudimos buscar la tablet. Revisa tu conexión e inténtalo de nuevo.';
}

export function SelectorTabletEntrega({
  prestamo,
  tablets,
  prestamos,
  opciones,
  valor,
  onElegir,
}: Props) {
  const buscar = useBuscarTabletPorCodigo();
  const [camara, setCamara] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const mensaje = buscar.error ? mensajeBusqueda(buscar.error) : aviso;

  // AvisoError ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
  }, [mensaje]);

  const alLeer = (codigo: string) => {
    setAviso(null);
    buscar.mutate(codigo, {
      onSuccess: (tablet) => {
        const asignacion = asignarTabletAlEntregar(tablets, prestamos, prestamo, tablet.id);
        if ('problema' in asignacion) setAviso(asignacion.problema);
        else onElegir(tablet.id, true);
      },
    });
  };

  const escanear = () => {
    buscar.reset();
    setAviso(null);
    setCamara(true);
  };

  const elegida = opciones.find((tablet) => tablet.id === valor);

  return (
    <View style={estilos.contenedor}>
      <CampoDesplegable
        etiqueta="Tablet que se entrega"
        nombre="Tablet que se entrega"
        opciones={opciones.map(nombreOpcion)}
        valor={elegida ? nombreOpcion(elegida) : ''}
        onCambiar={(nombre) => {
          const tablet = opciones.find((opcion) => nombreOpcion(opcion) === nombre);
          if (tablet) {
            buscar.reset();
            setAviso(null);
            onElegir(tablet.id, false);
          }
        }}
        textoVacio="Elige la tablet"
      />
      <Button
        mode="outlined"
        icon="barcode-scan"
        onPress={escanear}
        loading={buscar.isPending}
        disabled={buscar.isPending || camara}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Escanear el código de la tablet que se entrega"
      >
        Escanear
      </Button>
      {camara ? (
        <View style={estilos.camara}>
          <EscanerCodigos
            tipos={TIPOS_BARRAS}
            onLeido={(lectura) => {
              setCamara(false);
              alLeer(lectura.datos);
            }}
          />
          <Button
            mode="text"
            icon="close"
            onPress={() => setCamara(false)}
            style={estilos.boton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar la cámara"
          >
            Cerrar cámara
          </Button>
        </View>
      ) : null}
      {mensaje ? <AvisoError mensaje={mensaje} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s },
  camara: { gap: espacio.xs },
  boton: { alignSelf: 'flex-start' },
  // Al menos 44 de alto.
  contenidoBoton: { paddingVertical: espacio.xs },
});
