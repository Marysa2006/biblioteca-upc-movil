/**
 * Sección Espacios de Gestión (permiso `espacios`): la configuración de los espacios, con el
 * catálogo (HU-16) y los bloqueos (HU-20). Las solicitudes de reserva no van aquí: van en la
 * bandeja de Solicitudes (HU-19). Archivo de HU-16 y HU-20 UI (Jhon). Se ve con el permiso que
 * define gestion.tsx.
 *
 * Catálogo (HU-16): todos los espacios, también los inactivos; crear y editar en
 * /administracion/espacio (CA1, CA2) y activar o desactivar desde la tarjeta. Antes de
 * desactivar se advierten las reservas futuras (CA3).
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Portal, Snackbar } from 'react-native-paper';

import { DialogoDesactivarEspacio } from '@/components/espacios/DialogoDesactivarEspacio';
import { TarjetaEspacioAdmin } from '@/components/espacios/TarjetaEspacioAdmin';
import { EstadoCarga, EstadoError, EstadoVacio } from '@/components/ui';
import {
  useCambiarEstadoEspacio,
  useEspaciosAdministracion,
  useReservasFuturas,
} from '@/hooks/useEspacios';
import { espacio } from '@/theme';
import type { Espacio } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';

/** Tiempo que se ve el aviso de cada acción. */
const DURACION_AVISO_MS = 4000;

/** Primero los activos y, dentro de cada grupo, por nombre. */
function ordenarEspacios(lista: Espacio[]): Espacio[] {
  return [...lista].sort(
    (a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre, 'es'),
  );
}

export function SeccionEspacios() {
  const { data, isPending, isError, refetch } = useEspaciosAdministracion();
  const cambiarEstado = useCambiarEstadoEspacio();
  const [porDesactivar, setPorDesactivar] = useState<Espacio | null>(null);
  // Se pide aquí y no en el diálogo: el Portal queda fuera del QueryClientProvider.
  const reservasFuturas = useReservasFuturas(porDesactivar?.id ?? '');
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const activar = (actual: Espacio) => {
    cambiarEstado.mutate(
      { id: actual.id, activo: true },
      {
        onSuccess: () => setAviso(`${actual.nombre} ya se ofrece para reservar.`),
        onError: () => setAviso(`No se pudo activar ${actual.nombre}.`),
      },
    );
  };

  const abrirDesactivar = (actual: Espacio) => {
    cambiarEstado.reset();
    setPorDesactivar(actual);
  };

  const confirmarDesactivar = () => {
    if (!porDesactivar) return;
    const actual = porDesactivar;
    cambiarEstado.mutate(
      { id: actual.id, activo: false },
      {
        onSuccess: () => {
          setPorDesactivar(null);
          setAviso(`${actual.nombre} ya no se ofrece para reservar.`);
        },
      },
    );
  };

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando espacios…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar los espacios." onReintentar={() => refetch()} />;
  } else if (data.length === 0) {
    lista = <EstadoVacio mensaje="Todavía no hay espacios. Crea el primero." />;
  } else {
    lista = ordenarEspacios(data).map((actual) => (
      <TarjetaEspacioAdmin
        key={actual.id}
        espacioActual={actual}
        cambiando={cambiarEstado.isPending && cambiarEstado.variables?.id === actual.id}
        onEditar={() =>
          router.push({ pathname: '/administracion/espacio', params: { id: actual.id } })
        }
        onCambiarEstado={() => (actual.activo ? abrirDesactivar(actual) : activar(actual))}
      />
    ));
  }

  return (
    <View style={estilos.seccion}>
      <Button
        mode="contained"
        icon="plus"
        onPress={() => router.push('/administracion/espacio')}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Nuevo espacio"
      >
        Nuevo espacio
      </Button>
      {lista}

      <DialogoDesactivarEspacio
        espacioActual={porDesactivar}
        reservas={reservasFuturas}
        guardando={cambiarEstado.isPending}
        mensajeError={
          porDesactivar && cambiarEstado.error ? mensajeErrorGuardar(cambiarEstado.error) : null
        }
        onConfirmar={confirmarDesactivar}
        onCerrar={() => setPorDesactivar(null)}
      />

      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
