/**
 * Asesorías y jornadas (HU-13): la administración gestiona los temas de asesoría y las
 * jornadas de cada facilitador. Pantalla apilada que se abre desde Gestión → Portal, como
 * Contenidos y Parámetros.
 *
 * - Jornadas: crear y editar en /administracion/jornada; al guardar se generan las franjas.
 * - Temas: crear y editar en /administracion/tema, y activar o desactivar desde la tarjeta.
 * Patrón de datos: hooks de src/hooks/useAsesorias.ts y useUsuarios.ts → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Portal, SegmentedButtons, Snackbar } from 'react-native-paper';

import { TarjetaJornada } from '@/components/asesorias/TarjetaJornada';
import { TarjetaTema } from '@/components/asesorias/TarjetaTema';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useGuardarTema, useJornadas, useTemas } from '@/hooks/useAsesorias';
import { useRol } from '@/hooks/useRol';
import { useUsuarios } from '@/hooks/useUsuarios';
import { espacio } from '@/theme';
import type { Jornada, TemaAsesoria } from '@/types';

type Seccion = 'jornadas' | 'temas';

/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

export default function Asesorias() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Asesorías y jornadas" />
      {tienePermiso('asesorias') ? (
        <GestionAsesorias />
      ) : (
        <Pantalla titulo="Asesorías y jornadas" conEncabezado>
          <SinPermiso />
        </Pantalla>
      )}
    </>
  );
}

function GestionAsesorias() {
  // Al volver de un formulario, la pantalla sigue montada y conserva la sección elegida.
  const [seccion, setSeccion] = useState<Seccion>('jornadas');
  const [aviso, setAviso] = useState<string | null>(null);

  const temas = useTemas();
  const jornadas = useJornadas();
  const usuarios = useUsuarios();
  const recargando = temas.isRefetching || jornadas.isRefetching || usuarios.isRefetching;

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const recargar = () => {
    temas.refetch();
    jornadas.refetch();
    usuarios.refetch();
  };

  let contenido;
  if (temas.isPending || jornadas.isPending || usuarios.isPending) {
    contenido = <EstadoCarga mensaje="Cargando asesorías…" />;
  } else if (temas.isError || jornadas.isError || usuarios.isError) {
    contenido = <EstadoError mensaje="No pudimos cargar los temas y las jornadas." onReintentar={recargar} />;
  } else if (seccion === 'jornadas') {
    const nombreUsuario = new Map(usuarios.data.map((u) => [u.id, u.nombre]));
    contenido = (
      <SeccionJornadas
        jornadas={jornadas.data}
        temas={temas.data}
        nombreFacilitador={(id) => nombreUsuario.get(id) ?? 'Facilitador sin nombre'}
      />
    );
  } else {
    contenido = <SeccionTemas temas={temas.data} jornadas={jornadas.data} onAviso={setAviso} />;
  }

  return (
    <Pantalla
      titulo="Asesorías y jornadas"
      subtitulo="Temas de asesoría y horarios de atención de cada facilitador."
      conEncabezado
      recarga={{ recargando, onRecargar: recargar }}
    >
      <SegmentedButtons
        value={seccion}
        onValueChange={(valor) => setSeccion(valor as Seccion)}
        buttons={[
          { value: 'jornadas', label: 'Jornadas', icon: 'calendar-clock-outline' },
          { value: 'temas', label: 'Temas', icon: 'school-outline' },
        ]}
      />
      {contenido}

      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </Pantalla>
  );
}

type PropsJornadas = {
  jornadas: Jornada[];
  temas: TemaAsesoria[];
  nombreFacilitador: (id: string) => string;
};

/** Activas primero; dentro de cada grupo, por tema y hora de inicio. */
function ordenarJornadas(lista: Jornada[], temas: TemaAsesoria[]): Jornada[] {
  const nombreTema = (id: string) => temas.find((t) => t.id === id)?.nombre ?? '';
  return [...lista].sort(
    (a, b) =>
      Number(b.activa) - Number(a.activa) ||
      nombreTema(a.temaId).localeCompare(nombreTema(b.temaId), 'es') ||
      a.horaInicio.localeCompare(b.horaInicio),
  );
}

function SeccionJornadas({ jornadas, temas, nombreFacilitador }: PropsJornadas) {
  return (
    <View style={estilos.seccion}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => router.push('/administracion/jornada')}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Nueva jornada"
      >
        Nueva jornada
      </Button>
      {jornadas.length === 0 ? (
        <EstadoVacio mensaje="Todavía no hay jornadas. Crea la primera para generar franjas." />
      ) : (
        ordenarJornadas(jornadas, temas).map((jornada) => (
          <TarjetaJornada
            key={jornada.id}
            jornada={jornada}
            tema={temas.find((t) => t.id === jornada.temaId)?.nombre ?? 'Tema sin nombre'}
            facilitador={nombreFacilitador(jornada.facilitadorId)}
            onEditar={() =>
              router.push({ pathname: '/administracion/jornada', params: { id: jornada.id } })
            }
          />
        ))
      )}
    </View>
  );
}

type PropsTemas = {
  temas: TemaAsesoria[];
  jornadas: Jornada[];
  onAviso: (mensaje: string) => void;
};

function SeccionTemas({ temas, jornadas, onAviso }: PropsTemas) {
  const guardar = useGuardarTema();

  const alternar = (tema: TemaAsesoria) => {
    const activo = !tema.activo;
    guardar.mutate(
      { ...tema, activo },
      {
        onSuccess: () =>
          onAviso(
            activo
              ? `${tema.nombre} ya se ofrece para agendar.`
              : `${tema.nombre} ya no se ofrece para agendar.`,
          ),
        onError: () => onAviso(`No se pudo cambiar el estado de ${tema.nombre}.`),
      },
    );
  };

  const ordenados = [...temas].sort(
    (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'),
  );

  return (
    <View style={estilos.seccion}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => router.push('/administracion/tema')}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Nuevo tema"
      >
        Nuevo tema
      </Button>
      {ordenados.length === 0 ? (
        <EstadoVacio mensaje="Todavía no hay temas. Crea el primero." />
      ) : (
        ordenados.map((tema) => (
          <TarjetaTema
            key={tema.id}
            tema={tema}
            jornadas={jornadas.filter((j) => j.temaId === tema.id).length}
            cambiando={guardar.isPending && guardar.variables?.id === tema.id}
            onEditar={() => router.push({ pathname: '/administracion/tema', params: { id: tema.id } })}
            onCambiarEstado={() => alternar(tema)}
          />
        ))
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
