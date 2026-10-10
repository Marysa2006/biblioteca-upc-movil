/**
 * Panel del día del personal (provisional).
 * Incluye accesos para cambiar de vista y cerrar sesión, útiles mientras se prueba.
 */
import { router } from 'expo-router';
import { Button } from 'react-native-paper';

import { EnConstruccion, Pantalla } from '@/components/ui';
import { useSesion } from '@/store/sesion';
import { NOMBRE_ROL } from '@/utils/roles';

export default function Panel() {
  const usuario = useSesion((estado) => estado.usuario);
  const cerrarSesion = useSesion((estado) => estado.cerrarSesion);

  const salir = () => {
    cerrarSesion();
    router.replace('/');
  };

  return (
    <Pantalla
      titulo={usuario ? `Hola, ${usuario.nombre.split(' ')[0]}` : 'Panel'}
      subtitulo={usuario ? NOMBRE_ROL[usuario.rol] : undefined}>
      <EnConstruccion hu="HU-26" descripcion="Panel del día: trámites, ocupación de salas, tablets y asesorías." />
      <Button mode="outlined" onPress={() => router.replace('/')}>
        Ver la vista de la comunidad
      </Button>
      <Button mode="text" onPress={salir}>
        Cerrar sesión
      </Button>
    </Pantalla>
  );
}
