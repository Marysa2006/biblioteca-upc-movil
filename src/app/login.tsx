/**
 * Inicio de sesión PROVISIONAL.
 * Mientras se define el login institucional con el ingeniero de la biblioteca (HU-05),
 * esta pantalla permite entrar con usuarios de prueba para ver cada vista.
 * HU-05 (UI) la reemplaza por el diseño del mockup.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { TOKEN_PRUEBA, USUARIOS_PRUEBA } from '@/api/mocks/usuarios';
import { Pantalla } from '@/components/ui';
import { useSesion } from '@/store/sesion';
import { colores, espacio } from '@/theme';
import type { Usuario } from '@/types';
import { esPersonal, NOMBRE_ROL } from '@/utils/roles';

export default function Login() {
  const iniciarSesion = useSesion((estado) => estado.iniciarSesion);

  const entrar = (usuario: Usuario) => {
    iniciarSesion(usuario, TOKEN_PRUEBA);
    router.replace(esPersonal(usuario.rol) ? '/panel' : '/');
  };

  return (
    <Pantalla titulo="Ingresa a la biblioteca" subtitulo="Inicio de sesión provisional (HU-05)">
      <Text variant="bodyMedium" style={estilos.nota}>
        El inicio de sesión institucional se definirá con el ingeniero de la biblioteca. Por ahora,
        entra con un usuario de prueba:
      </Text>
      <View style={estilos.botones}>
        {USUARIOS_PRUEBA.map((usuario) => (
          <Button key={usuario.id} mode="contained-tonal" onPress={() => entrar(usuario)}>
            {`${usuario.nombre} · ${NOMBRE_ROL[usuario.rol]}`}
          </Button>
        ))}
      </View>
      <Button mode="text" onPress={() => router.replace('/')}>
        Continuar sin cuenta
      </Button>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  nota: { color: colores.textoSecundario },
  botones: { gap: espacio.s },
});
