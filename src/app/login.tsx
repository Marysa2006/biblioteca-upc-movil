/**
 * Inicio de sesión con el correo institucional (HU-05).
 * La abren la invitación de Inicio, Perfil, la vista del personal y los recursos de Catálogo;
 * el layout raíz la muestra como modal. El personal siempre entra al Panel; la comunidad, con
 * ?volver=1, regresa a la pantalla de origen.
 *
 * Patrón de datos: useIniciarSesion() (src/hooks) → iniciarSesionApi() (src/api) → mock o API.
 * Con mocks, todos los usuarios de prueba usan la contraseña biblioteca123.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { FormularioLogin } from '@/components/autenticacion/FormularioLogin';
import { AvisoError, Pantalla } from '@/components/ui';
import { mensajeErrorLogin, useIniciarSesion } from '@/hooks/useAutenticacion';
import { colores, espacio, radio } from '@/theme';
import { esPersonal } from '@/utils/roles';

export default function Login() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();
  const { mutate, isPending, error, reset } = useIniciarSesion();
  const mensajeError = error ? mensajeErrorLogin(error) : null;

  // accessibilityLiveRegion solo funciona en Android; en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && mensajeError) {
      AccessibilityInfo.announceForAccessibility(mensajeError);
    }
  }, [mensajeError]);

  const iniciarSesion = (credenciales: { correo: string; contrasena: string }) => {
    reset();
    mutate(credenciales, {
      // CA1: el hook ya guardó la sesión; solo falta llevar a cada quien a su vista.
      // El personal siempre va al Panel. La comunidad, con ?volver=1 (por ejemplo, desde
      // un recurso de Catálogo o desde Perfil), regresa a donde estaba.
      onSuccess: ({ usuario }) => {
        if (esPersonal(usuario)) {
          router.replace('/panel');
        } else if (volver === '1' && router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      },
    });
  };

  const explorarSinCuenta = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Pantalla
      titulo="Ingresar"
      subtitulo="Usa tus credenciales institucionales para solicitar servicios, préstamos y salas de estudio."
      conTeclado
      sinMenuUsuario
    >
      <View style={estilos.tarjeta}>
        {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
        <FormularioLogin enviando={isPending} onEnviar={iniciarSesion} />
      </View>

      <View style={estilos.separador}>
        <View style={estilos.linea} />
        <Text variant="bodyMedium" style={estilos.textoSeparador}>
          o
        </Text>
        <View style={estilos.linea} />
      </View>

      <Button
        mode="contained-tonal"
        icon="compass-outline"
        onPress={explorarSinCuenta}
        disabled={isPending}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Explorar sin iniciar sesión"
      >
        Explorar sin iniciar sesión
      </Button>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  separador: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  linea: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colores.bordeFuerte },
  textoSeparador: { color: colores.textoSecundario },
  contenidoBoton: { paddingVertical: espacio.xs },
});
