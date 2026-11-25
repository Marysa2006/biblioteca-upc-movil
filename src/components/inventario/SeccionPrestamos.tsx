/**
 * Sección Préstamos de Gestión (permiso `tablets`). Archivo de HU-23 (Jhon).
 *
 * Los préstamos por grupo, con chips: Entregar (reservados, con Registrar entrega), Recibir
 * (entregados a tiempo, con Registrar devolución y el tiempo que queda), Vencidos (HU-24: los que
 * pasaron la hora límite, con el aviso para contactar a las personas) e Historial (lo devuelto).
 * Entregar y recibir van en /administracion/prestamo. Vencidos era una pestaña de Gestión hasta
 * el #310; marcarlos y avisar sigue siendo de usePrestamosVencidos(), que Gestión consulta.
 * Con `?grupo=vencidos` (el Dashboard) abre en ese grupo; `abrir` lo repite en cada toque.
 * El encabezado y los chips de filtro la separan del selector de Gestión.
 *
 * Escanear (HU-31): es el botón flotante de la sección (BotonEscanearTablet), que Gestión pone
 * en Pantalla. Abre /administracion/escanear-tablet, con la cámara de la app.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { EncabezadoSeccion } from '@/components/inventario/EncabezadoSeccion';
import { TarjetaPrestamo } from '@/components/inventario/TarjetaPrestamo';
import {
  BotonFlotante,
  ChipsFiltro,
  ListaPaginada,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  type OpcionFiltro,
} from '@/components/ui';
import { usePrestamos, useTablets } from '@/hooks/useTablets';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { NOMBRE_GRUPO, prestamosDeGrupo, type GrupoPrestamos } from '@/utils/prestamos';
import { textoCantidadVencidos } from '@/utils/vencidos';

const GRUPOS: GrupoPrestamos[] = ['entregar', 'recibir', 'vencidos', 'devueltos'];

const VACIO: Record<GrupoPrestamos, string> = {
  entregar: 'No hay préstamos reservados por entregar.',
  recibir: 'No hay tablets prestadas a tiempo por recibir.',
  vencidos: 'No hay préstamos vencidos: todas las tablets están a tiempo.',
  devueltos: 'Todavía no hay devoluciones registradas.',
};

export function SeccionPrestamos() {
  const prestamos = usePrestamos('todas');
  const tablets = useTablets();
  const { grupo: grupoPedido, abrir: pedidoEn } = useLocalSearchParams<{
    grupo?: string;
    abrir?: string;
  }>();
  const pedido = GRUPOS.find((valor) => valor === grupoPedido);
  const [grupo, setGrupo] = useState<GrupoPrestamos>(pedido ?? 'entregar');
  // Como en gestion.tsx: cada toque del Dashboard vuelve a abrir el grupo pedido, sin efecto.
  const clavePedido = `${pedido ?? ''}|${pedidoEn ?? ''}`;
  const [pedidoPrevio, setPedidoPrevio] = useState(clavePedido);
  if (clavePedido !== pedidoPrevio) {
    setPedidoPrevio(clavePedido);
    if (pedido) setGrupo(pedido);
  }

  const abrir = (id: string, modo: 'entrega' | 'devolucion') =>
    router.push({ pathname: '/administracion/prestamo', params: { id, modo } });

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
      />
      <ChipsFiltro
        opciones={opciones}
        valor={grupo}
        onCambiar={setGrupo}
        descripcion="Filtrar préstamos"
      />
      {grupo === 'vencidos' && visibles.length > 0 ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Icon source="alert-circle-outline" size={24} color={coloresEstado.rechazada.texto} />
          <View style={estilos.textosAviso}>
            <Text variant="titleSmall" style={estilos.tituloAviso}>
              {textoCantidadVencidos(visibles.length)}
            </Text>
            <Text variant="bodyMedium" style={estilos.texto}>
              Contacta a las personas para que devuelvan las tablets en el mostrador.
            </Text>
          </View>
        </View>
      ) : null}
      {visibles.length === 0 ? (
        <EstadoVacio mensaje={VACIO[grupo]} />
      ) : (
        // 10 por página (#161); el filtro vuelve a la página 1.
        <ListaPaginada elementos={visibles} reinicio={grupo}>
          {(prestamo) => (
            <TarjetaPrestamo
              key={prestamo.id}
              prestamo={prestamo}
              tablet={tabletPorId.get(prestamo.tabletId)}
              onEntregar={() => abrir(prestamo.id, 'entrega')}
              onRecibir={() => abrir(prestamo.id, 'devolucion')}
              onVerConstancia={() =>
                router.push({ pathname: '/administracion/constancia', params: { id: prestamo.id } })
              }
            />
          )}
        </ListaPaginada>
      )}
    </View>
  );
}

/** Botón flotante "Escanear tablet" de la sección (HU-31); se encoge al deslizar. */
export function BotonEscanearTablet({ extendido }: { extendido: boolean }) {
  return (
    <BotonFlotante
      icono="barcode-scan"
      texto="Escanear tablet"
      etiqueta="Escanear el código de una tablet para registrar su devolución"
      onPress={() => router.push('/administracion/escanear-tablet')}
      extendido={extendido}
    />
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  textosAviso: { flex: 1, gap: espacio.xs },
  tituloAviso: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
});
