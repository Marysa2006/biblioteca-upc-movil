import { router } from 'expo-router';
import { Button } from 'react-native-paper';

import { EnConstruccion, Pantalla } from '@/components/ui';

export default function Inventario() {
  return (
    <Pantalla titulo="Inventario" subtitulo="Tablets y préstamos">
      <EnConstruccion hu="HU-21 y HU-23" descripcion="Inventario de tablets y registro de entrega y devolución." />
      {/* Spike de cámara (chore/spike-camara): solo en desarrollo, para probar la lectura de códigos de HU-31. */}
      {__DEV__ ? (
        <Button
          mode="outlined"
          icon="barcode-scan"
          onPress={() => router.push('/pruebas/camara')}
          accessibilityRole="button"
          accessibilityLabel="Abrir la prueba de cámara para leer códigos"
        >
          Prueba de cámara (desarrollo)
        </Button>
      ) : null}
    </Pantalla>
  );
}
