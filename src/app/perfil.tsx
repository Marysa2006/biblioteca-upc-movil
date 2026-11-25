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
import { FirmaEnVentana } from '@/components/inventario/FirmaEnVentana';
import { EnlacePoliticaDatos } from '@/components/privacidad/EnlacePoliticaDatos';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useCerrarSesion } from '@/hooks/useAutenticacion';
import { useActualizarPerfil, usePerfil } from '@/hooks/usePerfil';
import { useGuardarMiFirma } from '@/hooks/useUsuarios';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { DatosEditablesPerfil, Usuario } from '@/types';
import {
  CORREO_DATOS_PERSONALES,
  DIAS_HABILES_CONSULTA,
  DIAS_HABILES_RECLAMO,
  NIT_UNIVERSIDAD,
} from '@/utils/constantes';
import { mensajeErrorGuardar } from '@/utils/errores';
import { aceptacionVigente, fechaDeAceptacion } from '@/utils/privacidad';
import { describirRoles, esPersonal } from '@/utils/roles';

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
          {/* #225, CA1: la política también está a la vista sin sesión. */}
          <EnlacePoliticaDatos nota="La Universidad es la responsable del tratamiento de tus datos personales." />
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
  const aceptaciones = useSesion((estado) => estado.aceptaciones);
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  // La autorización vigente de esta persona, para mostrar cuándo la aceptó (#225).
  const aceptacion = aceptacionVigente(usuario, aceptaciones);

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

      {esPersonal(usuario) ? <MiFirma usuario={usuario} /> : null}

      <View style={estilos.tarjeta}>
        <Text variant="titleMedium" style={estilos.tituloTarjeta} accessibilityRole="header">
          Privacidad y datos personales
        </Text>
        <Text variant="bodySmall" style={estilos.notaTarjeta}>
          {`La Universidad Popular del Cesar (NIT ${NIT_UNIVERSIDAD}) es la responsable del tratamiento de tus datos. La política es el Acuerdo 019 del 5 de octubre de 2020. Para ejercer tus derechos, escribe a ${CORREO_DATOS_PERSONALES}: la Universidad responde las consultas en máximo ${DIAS_HABILES_CONSULTA} días hábiles y los reclamos en máximo ${DIAS_HABILES_RECLAMO} días hábiles.`}
        </Text>
        {aceptacion ? (
          <Text variant="bodySmall" style={estilos.notaTarjeta}>
            {`Aceptaste esta autorización el ${fechaDeAceptacion(aceptacion.fecha)}.`}
          </Text>
        ) : null}
        <EnlacePoliticaDatos />
      </View>

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

/**
 * La firma del personal (revisión de la 1.1): se registra una vez y se pone sola en las
 * constancias de las tablets que entregue o reciba. Sin ella, firma con su sesión.
 */
function MiFirma({ usuario }: { usuario: Usuario }) {
  const guardar = useGuardarMiFirma();
  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleMedium" style={estilos.tituloTarjeta} accessibilityRole="header">
        Mi firma
      </Text>
      <Text variant="bodySmall" style={estilos.notaTarjeta}>
        Regístrala una vez: se pone sola en las constancias de las tablets que entregues o recibas.
      </Text>
      <FirmaEnVentana
        firmante={usuario.nombre}
        valor={usuario.firma ?? null}
        onCambiar={(firma) => guardar.mutate(firma)}
        mensajeError={guardar.error ? mensajeErrorGuardar(guardar.error) : undefined}
        deshabilitado={guardar.isPending}
      />
    </View>
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
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  tituloTarjeta: { color: colores.texto, fontFamily: fuentes.negrita },
  notaTarjeta: { color: colores.textoSecundario },
  contenidoBoton: { paddingVertical: espacio.xs },
});
