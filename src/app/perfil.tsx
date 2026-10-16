/**
 * Perfil del usuario (HU-06): cabecera con iniciales, nombre y tipo o roles; datos
 * institucionales como lista (solo lectura); datos de contacto con "Editar"; y Cerrar sesión.
 * Pantalla apilada: se abre desde el menú de usuario (arriba a la derecha), no desde las pestañas.
 * Sin sesión, invita a iniciar sesión y vuelve aquí al entrar (/login?volver=1).
 *
 * Patrón de datos: usePerfil() / useActualizarPerfil() (src/hooks) → src/api/perfil.ts → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Portal, Snackbar, Text } from 'react-native-paper';

import { DatosContacto } from '@/components/perfil/DatosContacto';
import { DatosInstitucionales } from '@/components/perfil/DatosInstitucionales';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useCerrarSesion } from '@/hooks/useAutenticacion';
import { useActualizarPerfil, usePerfil } from '@/hooks/usePerfil';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes } from '@/theme';
import type { DatosEditablesPerfil, Usuario } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { describirRoles } from '@/utils/roles';

/** Tiempo que se ve la confirmación al guardar. */
const DURACION_CONFIRMACION_MS = 3000;
const MENSAJE_GUARDADO = 'Tu perfil quedó actualizado.';

export default function Perfil() {
  const usuario = useSesion((estado) => estado.usuario);

  return (
    <>
      <EncabezadoApilado titulo="Perfil" />
      {usuario ? (
        <PerfilConSesion usuario={usuario} />
      ) : (
        <Pantalla titulo="Perfil" subtitulo="Inicia sesión para ver y completar tu perfil." conEncabezado>
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
      )}
    </>
  );
}

/** "Laura Pérez" → "LP". */
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

function PerfilConSesion({ usuario }: { usuario: Usuario }) {
  const cerrarSesion = useCerrarSesion();
  const { data: perfil, isPending, isError, refetch } = usePerfil();
  const { mutate, isPending: guardando, error, reset } = useActualizarPerfil();
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && guardado) {
      AccessibilityInfo.announceForAccessibility(MENSAJE_GUARDADO);
    }
  }, [guardado]);

  const guardar = (datos: DatosEditablesPerfil) => {
    reset();
    mutate(datos, {
      onSuccess: () => {
        setEditando(false);
        setGuardado(true);
      },
    });
  };

  const cancelar = () => {
    reset();
    setEditando(false);
  };

  const salir = () => {
    cerrarSesion();
    router.replace('/');
  };

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando tu perfil…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar tu perfil." onReintentar={() => refetch()} />;
  } else {
    contenido = (
      <>
        <DatosInstitucionales perfil={perfil} />
        <DatosContacto
          perfil={perfil}
          editando={editando}
          guardando={guardando}
          mensajeError={error ? mensajeErrorGuardar(error) : null}
          onEditar={() => setEditando(true)}
          onCancelar={cancelar}
          onGuardar={guardar}
        />
      </>
    );
  }

  return (
    <Pantalla titulo="Perfil" conEncabezado conTeclado>
      <View style={estilos.cabecera}>
        <View
          style={estilos.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant="headlineSmall" style={estilos.iniciales}>
            {iniciales(usuario.nombre)}
          </Text>
        </View>
        <Text variant="titleLarge" style={estilos.nombre}>
          {usuario.nombre}
        </Text>
        <Text variant="bodyMedium" style={estilos.rol}>
          {describirRoles(usuario)}
        </Text>
      </View>

      {contenido}

      <Button
        mode="outlined"
        icon="logout"
        onPress={salir}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        Cerrar sesión
      </Button>

      <Portal>
        <Snackbar visible={guardado} onDismiss={() => setGuardado(false)} duration={DURACION_CONFIRMACION_MS}>
          {MENSAJE_GUARDADO}
        </Snackbar>
      </Portal>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: 'center', gap: espacio.xs, paddingVertical: espacio.s },
  // minWidth y no width: con letra grande, las iniciales agrandan el círculo en vez de cortarse.
  avatar: {
    minWidth: espacio.xl * 2,
    aspectRatio: 1,
    padding: espacio.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: espacio.xl * 2,
    backgroundColor: colores.primarioOscuro,
    marginBottom: espacio.xs,
  },
  iniciales: { color: colores.superficie, fontFamily: fuentes.negrita },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita, textAlign: 'center' },
  rol: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
