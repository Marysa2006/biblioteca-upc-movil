/**
 * Guías de la biblioteca (#258, HU-29): la biblioteca publica sus guías, con enlace (PDF o
 * Drive) o escritas en la app. Pantalla apilada que se abre desde Gestión → Portal → Guías.
 *
 * - Con el permiso `contenidos` o `novedades`.
 * - "Nueva guía" es el botón flotante; crear y editar en /administracion/guia.
 * - Publicar o despublicar desde el menú de la tarjeta: la despublicada desaparece para la
 *   comunidad (CA2).
 * Patrón de datos: hooks de src/hooks/useGuias.ts → src/api/guias.ts → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';

import { TarjetaGuiaAdmin } from '@/components/guias/TarjetaGuiaAdmin';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  BotonFlotante,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useCambiarPublicacionGuia, useGuiasAdministracion } from '@/hooks/useGuias';
import { useRol } from '@/hooks/useRol';
import { espacio } from '@/theme';
import type { Guia } from '@/types';

/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

export default function GuiasAdministracion() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Guías de la biblioteca" />
      {tienePermiso('contenidos') || tienePermiso('novedades') ? (
        <GestionGuias />
      ) : (
        <Pantalla titulo="Guías de la biblioteca" conEncabezado>
          <SinPermiso />
        </Pantalla>
      )}
    </>
  );
}

/** Las más recientes primero. */
const porFecha = (a: Guia, b: Guia) =>
  b.actualizada.localeCompare(a.actualizada) || a.titulo.localeCompare(b.titulo, 'es');

function GestionGuias() {
  const { data, isPending, isError, isRefetching, refetch } = useGuiasAdministracion();
  const cambiarPublicacion = useCambiarPublicacionGuia();
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const alternar = (guia: Guia) => {
    const publicado = !guia.publicado;
    cambiarPublicacion.mutate(
      { id: guia.id, publicado },
      {
        onSuccess: () =>
          setAviso(
            publicado
              ? `${guia.titulo} ya es visible en Catálogo → Guías.`
              : `${guia.titulo} ya no es visible para la comunidad.`,
          ),
        onError: () => setAviso(`No se pudo cambiar ${guia.titulo}.`),
      },
    );
  };

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando guías…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar las guías." onReintentar={() => refetch()} />;
  } else if (data.length === 0) {
    lista = <EstadoVacio mensaje="Todavía no hay guías. Publica la primera." />;
  } else {
    lista = [...data].sort(porFecha).map((guia) => (
      <TarjetaGuiaAdmin
        key={guia.id}
        guia={guia}
        ocupado={cambiarPublicacion.isPending && cambiarPublicacion.variables?.id === guia.id}
        onEditar={() => router.push({ pathname: '/administracion/guia', params: { id: guia.id } })}
        onCambiarPublicacion={() => alternar(guia)}
      />
    ));
  }

  return (
    <Pantalla
      titulo="Guías de la biblioteca"
      subtitulo="Lo que la comunidad ve en Catálogo → Guías."
      conEncabezado
      flotante={(desplazada: boolean) => (
        <BotonFlotante
          icono="plus"
          texto="Nueva guía"
          onPress={() => router.push('/administracion/guia')}
          extendido={!desplazada}
        />
      )}
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      <View style={estilos.lista}>{lista}</View>

      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.s },
});
