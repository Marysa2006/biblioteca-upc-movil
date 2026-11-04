/**
 * Sección Préstamos de Inventario (permiso `tablets`). Archivo de HU-23 (Jhon).
 * Se ve con el permiso que define inventario.tsx.
 *
 * Los préstamos por grupo, con chips: Por entregar (reservados, con Registrar entrega), Por
 * recibir (entregados y vencidos, con Registrar devolución y el tiempo o el retraso) y
 * Historial (lo devuelto, con novedades y retrasos). Entregar y recibir van en
 * /administracion/prestamo. La alerta de vencidos es de la sección Vencidos (HU-24).
 * El encabezado y los chips de filtro la separan de las pestañas de Inventario.
 *
 * Escanear (HU-31): el ícono del encabezado abre "Buscar una tablet". Al leer o escribir el
 * código se abre su devolución o su entrega, con la tablet ya verificada (CA1); si el código no
 * es del inventario o la tablet no tiene préstamos activos, el aviso sale en el diálogo (CA2).
 * Si el celular no tiene escáner del sistema, la cámara de la app se abre debajo del
 * encabezado: no va dentro del diálogo porque el Portal queda fuera de la navegación.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { EscanerCodigos } from '@/components/camara/EscanerCodigos';
import { DialogoBuscarTablet } from '@/components/inventario/DialogoBuscarTablet';
import { EncabezadoSeccion } from '@/components/inventario/EncabezadoSeccion';
import { TarjetaPrestamo } from '@/components/inventario/TarjetaPrestamo';
import {
  ChipsFiltro,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  type OpcionFiltro,
} from '@/components/ui';
import { TIPOS_BARRAS, useEscanerSistema } from '@/hooks/useEscanerSistema';
import { useBuscarTabletPorCodigo, usePrestamos, useTablets } from '@/hooks/useTablets';
import { espacio } from '@/theme';
import { accionDeTablet } from '@/utils/escanerTablet';
import { hoyISO } from '@/utils/fechas';
import { NOMBRE_GRUPO, prestamosDeGrupo, type GrupoPrestamos } from '@/utils/prestamos';

/** El mensaje de la API si el código no sirve (400 o 404); si no, uno de conexión. */
function mensajeBusqueda(error: Error): string {
  if ('estado' in error && (error.estado === 400 || error.estado === 404)) return error.message;
  return 'No pudimos buscar la tablet. Revisa tu conexión e inténtalo de nuevo.';
}

const GRUPOS: GrupoPrestamos[] = ['entregar', 'recibir', 'devueltos'];

const VACIO: Record<GrupoPrestamos, string> = {
  entregar: 'No hay préstamos reservados por entregar.',
  recibir: 'No hay tablets prestadas por recibir.',
  devueltos: 'Todavía no hay devoluciones registradas.',
};

export function SeccionPrestamos() {
  const prestamos = usePrestamos('todas');
  const tablets = useTablets();
  const [grupo, setGrupo] = useState<GrupoPrestamos>('entregar');
  const buscar = useBuscarTabletPorCodigo();
  const [dialogo, setDialogo] = useState(false);
  const [camara, setCamara] = useState(false);
  const [avisoEscaneo, setAvisoEscaneo] = useState<string | null>(null);
  const mensajeEscaneo = buscar.error ? mensajeBusqueda(buscar.error) : avisoEscaneo;

  // AvisoError ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && mensajeEscaneo) {
      AccessibilityInfo.announceForAccessibility(mensajeEscaneo);
    }
  }, [mensajeEscaneo]);

  const abrir = (id: string, modo: 'entrega' | 'devolucion', verificada = false) =>
    router.push({
      pathname: '/administracion/prestamo',
      params: verificada ? { id, modo, verificada: '1' } : { id, modo },
    });

  // HU-31: busca la tablet leída y abre el registro que le toca. Si no hay, el diálogo
  // (abierto o vuelto a abrir) dice por qué y deja reintentar o escribir el código.
  const alLeer = (codigo: string) => {
    setAvisoEscaneo(null);
    buscar.mutate(codigo, {
      onSuccess: (tablet) => {
        const accion = accionDeTablet(tablet, prestamos.data ?? [], hoyISO());
        if (accion.tipo === 'abrir') {
          buscar.reset();
          setDialogo(false);
          abrir(accion.prestamoId, accion.modo, true);
        } else {
          setAvisoEscaneo(accion.mensaje);
          setDialogo(true);
        }
      },
      onError: () => setDialogo(true),
    });
  };
  const escanerSistema = useEscanerSistema(alLeer);

  const abrirDialogo = () => {
    buscar.reset();
    setAvisoEscaneo(null);
    setDialogo(true);
  };

  const escanear = async () => {
    setDialogo(false);
    buscar.reset();
    setAvisoEscaneo(null);
    // Sin escáner del sistema, o si no abre, la cámara de la app.
    if (!(await escanerSistema.abrir())) setCamara(true);
  };

  if (prestamos.isPending || tablets.isPending) return <EstadoCarga mensaje="Cargando los préstamos…" />;
  if (prestamos.isError || tablets.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar los préstamos."
        onReintentar={() => {
          prestamos.refetch();
          tablets.refetch();
        }}
      />
    );
  }

  const opciones: OpcionFiltro<GrupoPrestamos>[] = GRUPOS.map((valor) => ({
    valor,
    etiqueta: NOMBRE_GRUPO[valor],
    cantidad: prestamosDeGrupo(prestamos.data, valor).length,
  }));
  const visibles = prestamosDeGrupo(prestamos.data, grupo);
  const tabletPorId = new Map(tablets.data.map((tablet) => [tablet.id, tablet]));

  return (
    <View style={estilos.seccion}>
      <EncabezadoSeccion
        icono="swap-horizontal"
        titulo="Préstamos"
        descripcion="Entrega las tablets reservadas y recibe las prestadas."
        accion={{
          icono: 'barcode-scan',
          etiqueta: 'Buscar una tablet con el escáner o por su código',
          onPress: abrirDialogo,
        }}
      />
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
            style={estilos.cerrarCamara}
            accessibilityRole="button"
            accessibilityLabel="Cerrar la cámara"
          >
            Cerrar cámara
          </Button>
        </View>
      ) : null}
      <ChipsFiltro
        opciones={opciones}
        valor={grupo}
        onCambiar={setGrupo}
        descripcion="Filtrar préstamos"
      />
      {visibles.length === 0 ? (
        <EstadoVacio mensaje={VACIO[grupo]} />
      ) : (
        visibles.map((prestamo) => (
          <TarjetaPrestamo
            key={prestamo.id}
            prestamo={prestamo}
            tablet={tabletPorId.get(prestamo.tabletId)}
            onEntregar={() => abrir(prestamo.id, 'entrega')}
            onRecibir={() => abrir(prestamo.id, 'devolucion')}
          />
        ))
      )}

      <DialogoBuscarTablet
        visible={dialogo}
        buscando={buscar.isPending}
        mensaje={mensajeEscaneo}
        onEscanear={() => void escanear()}
        onBuscar={alLeer}
        onCerrar={() => setDialogo(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  camara: { gap: espacio.xs },
  cerrarCamara: { alignSelf: 'flex-start' },
});
