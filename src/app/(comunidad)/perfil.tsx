/**
 * Perfil del usuario (HU-06): datos institucionales en solo lectura y datos de contacto editables.
 * Sin sesión, invita a iniciar sesión y vuelve aquí al entrar (/login?volver=1).
 *
 * Patrón de datos: usePerfil() / useActualizarPerfil() (src/hooks) → src/api/perfil.ts → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import { Button, Portal, Snackbar } from 'react-native-paper';

import { DatosInstitucionales } from '@/components/perfil/DatosInstitucionales';
import { FormularioPerfil } from '@/components/perfil/FormularioPerfil';
import { EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useCerrarSesion } from '@/hooks/useAutenticacion';
import { useActualizarPerfil, usePerfil } from '@/hooks/usePerfil';
import { useSesion } from '@/store/sesion';
import { espacio } from '@/theme';
import type { DatosEditablesPerfil } from '@/types';
import { esPersonal } from '@/utils/roles';

/** Tiempo que se ve la confirmación al guardar. */
const DURACION_CONFIRMACION_MS = 3000;
const MENSAJE_GUARDADO = 'Tu perfil quedó actualizado.';

/** Mensaje del error al guardar: el de la API si es de validación (400), o uno general. */
function mensajeErrorGuardar(error: Error): string {
  // Las pantallas no importan de src/api: se lee el código del error (ErrorApi.estado) sin la clase.
  if ('estado' in error && error.estado === 400) return error.message;
  return 'No pudimos guardar tus cambios. Revisa tu conexión e inténtalo de nuevo.';
}

export default function Perfil() {
  const usuario = useSesion((estado) => estado.usuario);
  const cerrarSesion = useCerrarSesion();
  const { data: perfil, isPending, isError, refetch } = usePerfil();
  const { mutate, isPending: guardando, error, reset } = useActualizarPerfil();
  const [guardado, setGuardado] = useState(false);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && guardado) {
      AccessibilityInfo.announceForAccessibility(MENSAJE_GUARDADO);
    }
  }, [guardado]);

  const guardar = (datos: DatosEditablesPerfil) => {
    reset();
    mutate(datos, { onSuccess: () => setGuardado(true) });
  };

  if (!usuario) {
    return (
      <Pantalla titulo="Perfil" subtitulo="Inicia sesión para ver y completar tu perfil.">
        <Button
          mode="contained"
          icon="login"
          onPress={() => router.push({ pathname: '/login', params: { volver: '1' } })}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          Iniciar sesión
        </Button>
      </Pantalla>
    );
  }

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando tu perfil…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar tu perfil." onReintentar={() => refetch()} />;
  } else {
    contenido = (
      <>
        <DatosInstitucionales perfil={perfil} />
        <FormularioPerfil
          perfil={perfil}
          guardando={guardando}
          mensajeError={error ? mensajeErrorGuardar(error) : null}
          onGuardar={guardar}
        />
      </>
    );
  }

  return (
    <Pantalla titulo="Perfil" subtitulo={usuario.correo} conTeclado>
      {contenido}

      {esPersonal(usuario) ? (
        <Button
          mode="contained-tonal"
          icon="view-dashboard-outline"
          onPress={() => router.replace('/panel')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Ir a la vista del personal"
        >
          Ir a la vista del personal
        </Button>
      ) : null}
      <Button
        mode="outlined"
        icon="logout"
        onPress={cerrarSesion}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        Cerrar sesión
      </Button>

      <Portal>
        <Snackbar
          visible={guardado}
          onDismiss={() => setGuardado(false)}
          duration={DURACION_CONFIRMACION_MS}
        >
          {MENSAJE_GUARDADO}
        </Snackbar>
      </Portal>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  contenidoBoton: { paddingVertical: espacio.xs },
});
