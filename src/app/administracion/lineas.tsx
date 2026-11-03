/**
 * Líneas de formación (HU-09): la administración define las capacitaciones que ofrece la
 * biblioteca. Pantalla apilada que se abre desde Gestión → Portal, junto a Asesorías y jornadas.
 *
 * - Crear y editar en /administracion/linea; "Nueva línea" es el botón flotante (CA1, CA2).
 * - Activar o desactivar desde el menú de la tarjeta. Antes de desactivar, el diálogo dice
 *   cuántas solicitudes activas tiene la línea y pide confirmar (CA3).
 * Patrón de datos: hooks de src/hooks/useCapacitaciones.ts → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';

import { DialogoDesactivarLinea } from '@/components/capacitaciones/DialogoDesactivarLinea';
import { TarjetaLinea } from '@/components/capacitaciones/TarjetaLinea';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  BotonFlotante,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useCambiarEstadoLinea, useLineas, useSolicitudesActivasLinea } from '@/hooks/useCapacitaciones';
import { useRol } from '@/hooks/useRol';
import { espacio } from '@/theme';
import type { LineaFormacion } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { ordenarLineas } from '@/utils/lineas';

/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

export default function Lineas() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Líneas de formación" />
      {tienePermiso('formacion') ? (
        <GestionLineas />
      ) : (
        <Pantalla titulo="Líneas de formación" conEncabezado>
          <SinPermiso />
        </Pantalla>
      )}
    </>
  );
}

function GestionLineas() {
  const { data, isPending, isError, isRefetching, refetch } = useLineas();
  const cambiarEstado = useCambiarEstadoLinea();
  const [porDesactivar, setPorDesactivar] = useState<LineaFormacion | null>(null);
  // Se pide aquí y no en el diálogo: el Portal queda fuera del QueryClientProvider.
  const solicitudesActivas = useSolicitudesActivasLinea(porDesactivar?.id ?? '');
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const activar = (linea: LineaFormacion) =>
    cambiarEstado.mutate(
      { id: linea.id, activa: true },
      {
        onSuccess: () => setAviso(`${linea.nombre} ya se ofrece para solicitar capacitación.`),
        onError: () => setAviso(`No se pudo activar ${linea.nombre}.`),
      },
    );

  const abrirDesactivar = (linea: LineaFormacion) => {
    cambiarEstado.reset();
    setPorDesactivar(linea);
  };

  const confirmarDesactivar = () => {
    if (!porDesactivar) return;
    const linea = porDesactivar;
    cambiarEstado.mutate(
      { id: linea.id, activa: false },
      {
        onSuccess: () => {
          setPorDesactivar(null);
          setAviso(`${linea.nombre} ya no se ofrece para solicitar capacitación.`);
        },
      },
    );
  };

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando líneas de formación…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar las líneas de formación." onReintentar={() => refetch()} />;
  } else if (data.length === 0) {
    contenido = <EstadoVacio mensaje="Todavía no hay líneas de formación. Crea la primera con Nueva línea." />;
  } else {
    contenido = ordenarLineas(data).map((linea) => (
      <TarjetaLinea
        key={linea.id}
        linea={linea}
        cambiando={cambiarEstado.isPending && cambiarEstado.variables?.id === linea.id}
        onEditar={() => router.push({ pathname: '/administracion/linea', params: { id: linea.id } })}
        onCambiarEstado={() => (linea.activa ? abrirDesactivar(linea) : activar(linea))}
      />
    ));
  }

  return (
    <Pantalla
      titulo="Líneas de formación"
      subtitulo="Las capacitaciones que la comunidad puede solicitar."
      conEncabezado
      flotante={(desplazada: boolean) => (
        <BotonFlotante
          icono="plus"
          texto="Nueva línea"
          etiqueta="Nueva línea de formación"
          onPress={() => router.push('/administracion/linea')}
          extendido={!desplazada}
        />
      )}
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      <View style={estilos.lista}>{contenido}</View>

      <DialogoDesactivarLinea
        linea={porDesactivar}
        solicitudes={solicitudesActivas}
        guardando={cambiarEstado.isPending}
        mensajeError={porDesactivar && cambiarEstado.error ? mensajeErrorGuardar(cambiarEstado.error) : null}
        onConfirmar={confirmarDesactivar}
        onCerrar={() => setPorDesactivar(null)}
      />

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
