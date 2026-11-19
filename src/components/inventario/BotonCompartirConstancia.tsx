/**
 * Compartir la constancia del préstamo en PDF (versión 1.1, #253): la genera con expo-print y
 * abre el menú del celular para enviarla (WhatsApp, correo, Drive…). Mientras la genera, el botón
 * queda ocupado; el resultado se dice debajo, también al lector de pantalla.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';

import { useCompartirConstancia } from '@/hooks/useTablets';
import { espacio } from '@/theme';
import type { ConstanciaPrestamo } from '@/utils/prestamos';

export function BotonCompartirConstancia({ constancia }: { constancia: ConstanciaPrestamo }) {
  const compartir = useCompartirConstancia();
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  const generar = () => {
    setAviso(null);
    compartir.mutate(constancia, {
      onSuccess: ({ compartido }) =>
        setAviso(compartido ? null : 'Se generó el PDF, pero este dispositivo no permite compartirlo.'),
      onError: () => setAviso('No se pudo generar el PDF. Inténtalo de nuevo.'),
    });
  };

  return (
    <View style={estilos.contenedor}>
      <Button
        mode="outlined"
        icon="file-pdf-box"
        onPress={generar}
        loading={compartir.isPending}
        disabled={compartir.isPending}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Compartir la constancia del préstamo en PDF"
      >
        Compartir constancia (PDF)
      </Button>
      <View accessibilityLiveRegion="polite">
        <HelperText type={compartir.isError ? 'error' : 'info'} visible={aviso != null}>
          {aviso ?? ''}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
