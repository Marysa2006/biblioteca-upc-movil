/**
 * Fotos de Inicio (#290): la biblioteca elige las fotos del carrusel de Inicio. Pantalla apilada
 * que se abre desde Gestión → Portal → Fotos de Inicio.
 *
 * - Con el permiso `fotos` (#296): la administración por su rol, o quien ella lo encargue.
 * - "Nueva foto" es el botón flotante; agregar y editar en /administracion/foto-inicio.
 * - Subir, Bajar y Publicar u Ocultar desde el menú de cada foto (CA2). Se publican máximo
 *   MAXIMO_FOTOS_INICIO: la API rechaza la siguiente y el aviso lo explica (CA4).
 * - Sin fotos publicadas, Inicio muestra las que trae la app (CA3); la pantalla lo dice.
 * Patrón de datos: hooks de src/hooks/useFotosInicio.ts → src/api/fotosInicio.ts → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Snackbar, Text } from 'react-native-paper';

import { TarjetaFotoInicioAdmin } from '@/components/inicio/TarjetaFotoInicioAdmin';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  BotonFlotante,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import {
  useCambiarPublicacionFotoInicio,
  useFotosInicioAdministracion,
  useReordenarFotosInicio,
} from '@/hooks/useFotosInicio';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, radio } from '@/theme';
import type { FotoInicio } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { fotosPublicadas, MAXIMO_FOTOS_INICIO } from '@/utils/inicio';

const TITULO = 'Fotos de Inicio';
/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

export default function FotosInicio() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      {tienePermiso('fotos') ? (
        <GestionFotos />
      ) : (
        <Pantalla titulo={TITULO} conEncabezado>
          <SinPermiso />
        </Pantalla>
      )}
    </>
  );
}

function GestionFotos() {
  const { data, isPending, isError, isRefetching, refetch } = useFotosInicioAdministracion();
  const publicacion = useCambiarPublicacionFotoInicio();
  const reordenar = useReordenarFotosInicio();
  const [aviso, setAviso] = useState<string | null>(null);
  const [moviendo, setMoviendo] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  const fotos = [...(data ?? [])].sort((a, b) => a.orden - b.orden);
  const publicadas = fotosPublicadas(fotos);

  const alternar = (foto: FotoInicio) => {
    const publicada = !foto.publicada;
    publicacion.mutate(
      { id: foto.id, publicada },
      {
        onSuccess: () =>
          setAviso(publicada ? 'La foto ya se ve en Inicio.' : 'La foto ya no se ve en Inicio.'),
        // El del máximo de fotos publicadas (CA4) llega de la API con su explicación.
        onError: (error) => setAviso(mensajeErrorGuardar(error)),
      },
    );
  };

  const mover = (posicion: number, destino: number) => {
    const ids = fotos.map((foto) => foto.id);
    const [movida] = ids.splice(posicion, 1);
    ids.splice(destino, 0, movida);
    setMoviendo(movida);
    reordenar.mutate(ids, {
      onSuccess: () => setAviso(`La foto quedó en el lugar ${destino + 1} de ${ids.length}.`),
      onError: (error) => setAviso(mensajeErrorGuardar(error)),
      onSettled: () => setMoviendo(null),
    });
  };

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando las fotos…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar las fotos." onReintentar={() => refetch()} />;
  } else if (fotos.length === 0) {
    lista = (
      <EstadoVacio mensaje="Todavía no hay fotos. Mientras tanto, Inicio muestra las que trae la app." />
    );
  } else {
    lista = fotos.map((foto, posicion) => {
      const lugar = foto.publicada ? publicadas.findIndex((p) => p.id === foto.id) + 1 : null;
      const ocupada =
        (publicacion.isPending && publicacion.variables?.id === foto.id) || moviendo === foto.id;
      return (
        <TarjetaFotoInicioAdmin
          key={foto.id}
          foto={foto}
          lugar={lugar}
          totalPublicadas={publicadas.length}
          ocupado={ocupada}
          onEditar={() =>
            router.push({ pathname: '/administracion/foto-inicio', params: { id: foto.id } })
          }
          onSubir={posicion > 0 ? () => mover(posicion, posicion - 1) : undefined}
          onBajar={posicion < fotos.length - 1 ? () => mover(posicion, posicion + 1) : undefined}
          onCambiarPublicacion={() => alternar(foto)}
        />
      );
    });
  }

  return (
    <Pantalla
      titulo={TITULO}
      subtitulo="Las fotos del carrusel que ve la comunidad en Inicio, en este orden."
      conEncabezado
      flotante={(desplazada: boolean) => (
        <BotonFlotante
          icono="image-plus"
          texto="Nueva foto"
          etiqueta="Agregar una foto al carrusel de Inicio"
          onPress={() => router.push('/administracion/foto-inicio')}
          extendido={!desplazada}
        />
      )}
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      {data ? (
        <View style={estilos.resumen}>
          <Text variant="bodyMedium" style={estilos.textoResumen}>
            {publicadas.length > 0
              ? `${publicadas.length} de ${MAXIMO_FOTOS_INICIO} fotos publicadas.`
              : 'Ninguna foto publicada: Inicio muestra las que trae la app.'}
          </Text>
        </View>
      ) : null}
      <View style={estilos.lista}>{lista}</View>

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
  );
}

const estilos = StyleSheet.create({
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  resumen: {
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textoResumen: { color: colores.texto },
  lista: { gap: espacio.s },
});
