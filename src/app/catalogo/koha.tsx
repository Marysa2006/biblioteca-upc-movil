/**
 * Catálogo de la biblioteca en Koha (HU-02). Pantalla apilada que se abre desde la pestaña
 * Catálogo.
 *
 * La búsqueda muestra los resultados aquí mismo, de 20 en 20; cada uno abre su ficha del OPAC
 * en el navegador integrado, donde están los ejemplares y su disponibilidad. "Abrir catálogo"
 * abre la página principal, si Koha responde.
 * Patrón de datos: useBusquedaCatalogo() → buscarEnCatalogo() → RSS público de Koha.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { Button, Portal, Snackbar, Text } from 'react-native-paper';

import { CampoBusqueda } from '@/components/catalogo/CampoBusqueda';
import { ResultadosBusqueda, type TextosFuente } from '@/components/catalogo/ResultadosBusqueda';
import { AvisoError, EncabezadoApilado, Pantalla } from '@/components/ui';
import {
  type ResultadoBusqueda,
  useBusquedaCatalogo,
  useCatalogoKoha,
} from '@/hooks/useCatalogoKoha';
import { colores, coloresEstado, espacio } from '@/theme';
import { abrirEnNavegador } from '@/utils/navegador';

/** Tiempo que se ve el aviso cuando el navegador no se puede abrir. */
const DURACION_AVISO_MS = 4000;

const MENSAJE_NO_DISPONIBLE = 'El catálogo no está disponible en este momento. Intenta más tarde.';

const TEXTOS_KOHA: TextosFuente = {
  nombre: 'el catálogo',
  nota: 'Toca un resultado para ver sus ejemplares y si está disponible.',
  accion: 'Abre la ficha en el catálogo',
  filtrar: 'Filtrar en Koha',
};

export default function CatalogoKoha() {
  const { estado, abrirCatalogo } = useCatalogoKoha();
  // Texto enviado desde el campo; vacío, no hay resultados.
  const [textoBuscado, setTextoBuscado] = useState('');
  const busqueda = useBusquedaCatalogo(textoBuscado);
  const resultados = busqueda.data?.pages.flatMap((pagina) => pagina.resultados) ?? [];
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar y AvisoError ya traen accessibilityLiveRegion (Android); en iOS, aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);
  useEffect(() => {
    if (Platform.OS === 'ios' && estado === 'no_disponible') {
      AccessibilityInfo.announceForAccessibility(MENSAJE_NO_DISPONIBLE);
    }
  }, [estado]);

  const abrirResultado = (resultado: ResultadoBusqueda) => {
    abrirEnNavegador(resultado.url).catch(() =>
      setAviso('No se pudo abrir la ficha. Intenta de nuevo.'),
    );
  };

  const comprobando = estado === 'comprobando';

  return (
    <>
      <EncabezadoApilado titulo="Catálogo de la biblioteca" />
      <Pantalla
        titulo="Catálogo de la biblioteca"
        subtitulo="Libros, revistas, tesis y demás material de la biblioteca, en Koha."
        conEncabezado
        recarga={
          textoBuscado !== ''
            ? { recargando: busqueda.isRefetching, onRecargar: () => busqueda.refetch() }
            : undefined
        }
      >
        <CampoBusqueda
          etiqueta="Buscar en el catálogo"
          ejemplo="Título, autor o tema"
          onBuscar={setTextoBuscado}
        />

        {textoBuscado !== '' ? (
          <ResultadosBusqueda
            textos={TEXTOS_KOHA}
            texto={textoBuscado}
            resultados={resultados}
            total={busqueda.data?.pages[0]?.total ?? 0}
            cargando={busqueda.isPending}
            error={busqueda.isError && !busqueda.isFetchNextPageError}
            onReintentar={() => busqueda.refetch()}
            hayMas={busqueda.hasNextPage}
            cargandoMas={busqueda.isFetchingNextPage}
            errorMas={busqueda.isFetchNextPageError}
            onVerMas={() => busqueda.fetchNextPage()}
            onAbrir={abrirResultado}
            onFiltrar={() => abrirCatalogo(textoBuscado)}
          />
        ) : estado === 'no_disponible' ? (
          <AvisoError mensaje={MENSAJE_NO_DISPONIBLE}>
            <Button
              mode="outlined"
              icon="refresh"
              onPress={() => abrirCatalogo()}
              textColor={coloresEstado.rechazada.texto}
              style={estilos.botonReintentar}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Reintentar abrir el catálogo"
            >
              Reintentar
            </Button>
          </AvisoError>
        ) : (
          <>
            <Button
              mode="outlined"
              icon="open-in-new"
              onPress={() => abrirCatalogo()}
              loading={comprobando}
              disabled={comprobando}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="link"
              accessibilityLabel="Abrir el catálogo completo en el navegador"
            >
              Abrir catálogo
            </Button>
            <Text variant="bodySmall" style={estilos.nota}>
              El catálogo completo se abre en el navegador; al cerrarlo vuelves aquí.
            </Text>
          </>
        )}

        <Portal>
          <Snackbar
            visible={aviso != null}
            onDismiss={() => setAviso(null)}
            duration={DURACION_AVISO_MS}
          >
            {aviso}
          </Snackbar>
        </Portal>
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  botonReintentar: { borderColor: coloresEstado.rechazada.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
  nota: { color: colores.textoSecundario },
});
