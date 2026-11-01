/**
 * Repositorio institucional en DSpace (HU-11): trabajos de grado e investigaciones de la
 * Universidad. Pantalla apilada que se abre desde la pestaña Catálogo.
 *
 * La búsqueda muestra los resultados aquí mismo, de 20 en 20; cada uno abre su página del
 * repositorio en el navegador integrado, donde están el resumen y el archivo.
 * Patrón de datos: useBusquedaRepositorio() → buscarEnRepositorio() → API pública de DSpace.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { Button, Portal, Snackbar, Text } from 'react-native-paper';

import { CampoBusqueda } from '@/components/catalogo/CampoBusqueda';
import { ResultadosBusqueda, type TextosFuente } from '@/components/catalogo/ResultadosBusqueda';
import { EncabezadoApilado, Pantalla } from '@/components/ui';
import { abrirRepositorio, useBusquedaRepositorio } from '@/hooks/useRepositorio';
import { colores, espacio } from '@/theme';
import type { ResultadoBusqueda } from '@/utils/busqueda';
import { abrirEnNavegador } from '@/utils/navegador';

/** Tiempo que se ve el aviso cuando el navegador no se puede abrir. */
const DURACION_AVISO_MS = 4000;

const TEXTOS_REPOSITORIO: TextosFuente = {
  nombre: 'el repositorio',
  nota: 'Toca un trabajo para ver su resumen y descargarlo.',
  accion: 'Abre el trabajo en el repositorio',
  filtrar: 'Filtrar en el repositorio',
};

export default function Repositorio() {
  // Texto enviado desde el campo; vacío, no hay resultados.
  const [textoBuscado, setTextoBuscado] = useState('');
  const busqueda = useBusquedaRepositorio(textoBuscado);
  const resultados = busqueda.data?.pages.flatMap((pagina) => pagina.resultados) ?? [];
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  const conAviso = (abrir: Promise<unknown>) =>
    abrir.catch(() => setAviso('No se pudo abrir el repositorio. Intenta de nuevo.'));

  const abrirResultado = (resultado: ResultadoBusqueda) => conAviso(abrirEnNavegador(resultado.url));

  return (
    <>
      <EncabezadoApilado titulo="Repositorio institucional" />
      <Pantalla
        titulo="Repositorio institucional"
        subtitulo="Trabajos de grado, tesis e investigaciones de la Universidad, en texto completo."
        conEncabezado
        recarga={
          textoBuscado !== ''
            ? { recargando: busqueda.isRefetching, onRecargar: () => busqueda.refetch() }
            : undefined
        }
      >
        <CampoBusqueda
          etiqueta="Buscar en el repositorio"
          ejemplo="Título, autor o tema"
          onBuscar={setTextoBuscado}
        />

        {textoBuscado !== '' ? (
          <ResultadosBusqueda
            textos={TEXTOS_REPOSITORIO}
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
            onFiltrar={() => conAviso(abrirRepositorio(textoBuscado))}
          />
        ) : (
          <>
            <Button
              mode="outlined"
              icon="open-in-new"
              onPress={() => conAviso(abrirRepositorio())}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="link"
              accessibilityLabel="Abrir el repositorio completo en el navegador"
            >
              Abrir repositorio
            </Button>
            <Text variant="bodySmall" style={estilos.nota}>
              El repositorio completo se abre en el navegador; al cerrarlo vuelves aquí.
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
  contenidoBoton: { paddingVertical: espacio.xs },
  nota: { color: colores.textoSecundario },
});
