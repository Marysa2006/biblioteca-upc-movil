/**
 * Perfil (provisional). Muestra la sesión de prueba y permite cambiar de usuario.
 * HU-06 (UI) la reemplaza por el diseño del mockup.
 */
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { EnConstruccion, Pantalla } from '@/components/ui';
import { useSesion } from '@/store/sesion';
import { colores } from '@/theme';
import { esPersonal, NOMBRE_ROL } from '@/utils/roles';

export default function Perfil() {
  const usuario = useSesion((estado) => estado.usuario);
  const cerrarSesion = useSesion((estado) => estado.cerrarSesion);

  return (
    <Pantalla titulo="Perfil" subtitulo={usuario ? usuario.correo : 'No has iniciado sesión'}>
      {usuario ? (
        <Card mode="contained" style={estilos.tarjeta}>
          <Card.Title title={usuario.nombre} subtitle={NOMBRE_ROL[usuario.rol]} />
          {usuario.programa ? (
            <Card.Content>
              <Text variant="bodyMedium">{usuario.programa}</Text>
            </Card.Content>
          ) : null}
        </Card>
      ) : null}

      {usuario && esPersonal(usuario.rol) ? (
        <Button mode="contained" onPress={() => router.replace('/panel')}>
          Ir a la vista del personal
        </Button>
      ) : null}

      {usuario ? (
        <Button mode="outlined" onPress={cerrarSesion}>
          Cerrar sesión
        </Button>
      ) : (
        <Button mode="contained" onPress={() => router.push('/login')}>
          Iniciar sesión
        </Button>
      )}

      <EnConstruccion hu="HU-06" descripcion="Perfil con datos institucionales y los datos que falten." />
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie },
});
