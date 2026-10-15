/**
 * Contenidos del portal (HU-04): la administración gestiona los servicios y los avisos y novedades.
 * Pantalla apilada fuera de las pestañas; se abre desde el menú "Administración" de Personal.
 *
 * - Servicios: crear, editar y activar o desactivar (CA1, CA2). Sin orden manual: van por categoría.
 * - Avisos y novedades: crear, editar, publicar u ocultar (CA1, CA2) y cambiar el orden (CA4).
 * Patrón de datos: hooks de src/hooks/useServicios.ts y useContenidos.ts → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Portal, SegmentedButtons, Snackbar } from 'react-native-paper';

import { TarjetaContenido } from '@/components/contenidos/TarjetaContenido';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { TarjetaServicioAdmin } from '@/components/servicios/TarjetaServicioAdmin';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import {
  useCambiarPublicacion,
  useContenidos,
  useReordenarContenidos,
} from '@/hooks/useContenidos';
import { useRol } from '@/hooks/useRol';
import { useCambiarEstadoServicio, useServiciosAdministracion } from '@/hooks/useServicios';
import { espacio } from '@/theme';
import type { Contenido, Servicio } from '@/types';
import { TIPOS_EDITABLES } from '@/utils/contenidos';
import { ORDEN_CATEGORIAS } from '@/utils/servicios';

type Seccion = 'servicios' | 'avisos';

/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

export default function Contenidos() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Contenidos del portal" />
      {tienePermiso('contenidos') ? (
        <GestionContenidos />
      ) : (
        <Pantalla titulo="Contenidos del portal" conEncabezado>
          <SinPermiso />
        </Pantalla>
      )}
    </>
  );
}

function GestionContenidos() {
  // Al volver de un formulario, la pantalla sigue montada y conserva la sección elegida.
  const [seccion, setSeccion] = useState<Seccion>('servicios');
  const [aviso, setAviso] = useState<string | null>(null);

  const servicios = useServiciosAdministracion();
  const contenidos = useContenidos();
  const recargar = () => (seccion === 'servicios' ? servicios.refetch() : contenidos.refetch());

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  return (
    <Pantalla
      titulo="Contenidos del portal"
      subtitulo="Lo que la comunidad ve en Inicio y en Servicios."
      conEncabezado
      recarga={{
        recargando: seccion === 'servicios' ? servicios.isRefetching : contenidos.isRefetching,
        onRecargar: recargar,
      }}
    >
      <SegmentedButtons
        value={seccion}
        onValueChange={(valor) => setSeccion(valor as Seccion)}
        buttons={[
          { value: 'servicios', label: 'Servicios', icon: 'room-service-outline' },
          { value: 'avisos', label: 'Avisos y novedades', icon: 'bullhorn-outline' },
        ]}
      />

      {seccion === 'servicios' ? (
        <SeccionServicios consulta={servicios} onAviso={setAviso} />
      ) : (
        <SeccionAvisos consulta={contenidos} onAviso={setAviso} />
      )}

      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </Pantalla>
  );
}

type PropsServicios = {
  consulta: ReturnType<typeof useServiciosAdministracion>;
  onAviso: (mensaje: string) => void;
};

/** Por categoría (en el orden de Inicio) y, dentro de cada una, por nombre. */
function ordenarServicios(lista: Servicio[]): Servicio[] {
  return [...lista].sort(
    (a, b) =>
      ORDEN_CATEGORIAS.indexOf(a.categoria) - ORDEN_CATEGORIAS.indexOf(b.categoria) ||
      a.nombre.localeCompare(b.nombre, 'es'),
  );
}

function SeccionServicios({ consulta, onAviso }: PropsServicios) {
  const { data, isPending, isError, refetch } = consulta;
  const cambiarEstado = useCambiarEstadoServicio();

  const alternar = (servicio: Servicio) => {
    const activo = !servicio.activo;
    cambiarEstado.mutate(
      { id: servicio.id, activo },
      {
        onSuccess: () =>
          onAviso(
            activo
              ? `${servicio.nombre} ya es visible para la comunidad.`
              : `${servicio.nombre} ya no es visible para la comunidad.`,
          ),
        onError: () => onAviso(`No se pudo cambiar el estado de ${servicio.nombre}.`),
      },
    );
  };

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando servicios…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar los servicios." onReintentar={() => refetch()} />;
  } else if (data.length === 0) {
    lista = <EstadoVacio mensaje="Todavía no hay servicios. Crea el primero." />;
  } else {
    lista = ordenarServicios(data).map((servicio) => (
      <TarjetaServicioAdmin
        key={servicio.id}
        servicio={servicio}
        cambiando={cambiarEstado.isPending && cambiarEstado.variables?.id === servicio.id}
        onEditar={() =>
          router.push({ pathname: '/administracion/servicio', params: { id: servicio.id } })
        }
        onCambiarEstado={() => alternar(servicio)}
      />
    ));
  }

  return (
    <View style={estilos.seccion}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => router.push('/administracion/servicio')}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Nuevo servicio"
      >
        Nuevo servicio
      </Button>
      {lista}
    </View>
  );
}

type PropsAvisos = {
  consulta: ReturnType<typeof useContenidos>;
  onAviso: (mensaje: string) => void;
};

const esEditable = (contenido: Contenido) =>
  (TIPOS_EDITABLES as readonly string[]).includes(contenido.tipo);

function SeccionAvisos({ consulta, onAviso }: PropsAvisos) {
  const { data, isPending, isError, refetch } = consulta;
  const cambiarPublicacion = useCambiarPublicacion();
  const reordenar = useReordenarContenidos();

  const alternar = (contenido: Contenido) => {
    const publicado = !contenido.publicado;
    cambiarPublicacion.mutate(
      { id: contenido.id, publicado },
      {
        onSuccess: () =>
          onAviso(
            publicado
              ? `${contenido.titulo} ya es visible en Inicio.`
              : `${contenido.titulo} ya no es visible para la comunidad.`,
          ),
        onError: () => onAviso(`No se pudo cambiar ${contenido.titulo}.`),
      },
    );
  };

  /**
   * Mueve un aviso o informativo un puesto (CA4). Se envía el orden de todos los contenidos,
   * también los de tipo servicio que no se muestran aquí, para no desordenarlos.
   */
  const mover = (todos: Contenido[], visibles: Contenido[], indice: number, paso: -1 | 1) => {
    const actual = visibles[indice];
    const vecino = visibles[indice + paso];
    const ids = todos.map((c) => c.id);
    const a = ids.indexOf(actual.id);
    const b = ids.indexOf(vecino.id);
    [ids[a], ids[b]] = [ids[b], ids[a]];
    reordenar.mutate(ids, {
      onError: () => onAviso('No se pudo cambiar el orden. Intenta de nuevo.'),
    });
  };

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando avisos y novedades…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar los contenidos." onReintentar={() => refetch()} />;
  } else {
    const visibles = data.filter(esEditable);
    lista =
      visibles.length === 0 ? (
        <EstadoVacio mensaje="Todavía no hay avisos ni novedades. Crea el primero." />
      ) : (
        visibles.map((contenido, indice) => (
          <TarjetaContenido
            key={contenido.id}
            contenido={contenido}
            esPrimero={indice === 0}
            esUltimo={indice === visibles.length - 1}
            ocupado={
              reordenar.isPending ||
              (cambiarPublicacion.isPending && cambiarPublicacion.variables?.id === contenido.id)
            }
            onEditar={() =>
              router.push({ pathname: '/administracion/contenido', params: { id: contenido.id } })
            }
            onCambiarPublicacion={() => alternar(contenido)}
            onSubir={() => mover(data, visibles, indice, -1)}
            onBajar={() => mover(data, visibles, indice, 1)}
          />
        ))
      );
  }

  return (
    <View style={estilos.seccion}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => router.push('/administracion/contenido')}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Nuevo aviso o novedad"
      >
        Nuevo aviso o novedad
      </Button>
      {lista}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
