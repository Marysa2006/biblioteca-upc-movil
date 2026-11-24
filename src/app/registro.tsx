/**
 * Registro provisional de una cuenta de la comunidad (#203). Se abre desde el login («¿No tienes
 * cuenta? Regístrate») y reemplaza a esa pantalla, así el botón atrás vuelve a donde estaba la
 * persona antes de entrar.
 * - CA1: con los datos completos y válidos, la cuenta se crea, la sesión queda iniciada y va a
 *   Inicio.
 * - CA2: los errores van bajo su campo, también los de la API (correo o cédula repetidos,
 *   contraseña débil); los demás (429, conexión), arriba del botón.
 * - CA3: la cuenta queda sin rol: los roles los asigna la administración en Personal → Equipo.
 * - CA4: los datos del registro llegan prellenados a las solicitudes (datosSolicitanteDe()).
 *
 * Patrón de datos: useRegistrarCuenta() (src/hooks) → registrarCuentaApi() (src/api) → mock o
 * `POST register/`.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { FormularioRegistro } from '@/components/autenticacion/FormularioRegistro';
import { AvisoConexionLenta, EncabezadoApilado, Pantalla } from '@/components/ui';
import { errorRegistro, useRegistrarCuenta } from '@/hooks/useAutenticacion';
import { colores, espacio } from '@/theme';
import type { NuevaCuenta } from '@/utils/registro';

const TITULO = 'Crear cuenta';

export default function Registro() {
  const { mutate, isPending, error, reset } = useRegistrarCuenta();
  const errorApi = error ? errorRegistro(error) : null;

  const registrar = (cuenta: NuevaCuenta) => {
    reset();
    // CA1: el hook ya inició la sesión; Inicio de la comunidad.
    mutate(cuenta, { onSuccess: () => router.replace('/') });
  };

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Para estudiantes, docentes y administrativos de la Universidad, con tu correo institucional."
        conEncabezado
        conTeclado
      >
        <FormularioRegistro enviando={isPending} errorApi={errorApi} onEnviar={registrar} />
        {isPending ? <AvisoConexionLenta /> : null}

        <View style={estilos.yaTengo}>
          <Text variant="bodyMedium" style={estilos.texto}>
            ¿Ya tienes cuenta?
          </Text>
          <Button
            mode="text"
            onPress={() => router.replace('/login')}
            disabled={isPending}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ya tengo cuenta: iniciar sesión"
          >
            Inicia sesión
          </Button>
        </View>
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  // Con letra grande, el botón pasa a otra línea en vez de cortarse.
  yaTengo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.xs,
  },
  texto: { color: colores.textoSecundario },
  contenidoBoton: { paddingVertical: espacio.xs },
});
