/**
 * «Abrir enlace» de una asesoría virtual aprobada (#249, CA3): el enlace lo pone el personal al
 * aprobar. Se abre con Linking y no en el navegador integrado, para que Meet o Teams lo tomen
 * con su aplicación si está instalada. Si no se puede abrir, lo dice y muestra el enlace.
 * Sin enlace (presencial, pendiente o sin dato), no muestra nada.
 */
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { espacio, fuentes } from '@/theme';
import type { Cita } from '@/types';
import { enlaceCita } from '@/utils/asesorias';

type Props = { cita: Pick<Cita, 'modalidad' | 'estado' | 'enlaceVirtual' | 'tema'> };

export function BotonEnlaceCita({ cita }: Props) {
  const [error, setError] = useState<string | null>(null);
  const enlace = enlaceCita(cita);
  if (!enlace) return null;

  const abrir = () => {
    setError(null);
    Linking.openURL(enlace).catch(() =>
      setError(`No pudimos abrir el enlace. Cópialo en el navegador: ${enlace}`),
    );
  };

  return (
    <View style={estilos.contenedor}>
      <Button
        mode="contained"
        icon="video-outline"
        onPress={abrir}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.textoBoton}
        accessibilityRole="link"
        accessibilityLabel={`Abrir el enlace de la asesoría virtual de ${cita.tema}`}
      >
        Abrir enlace
      </Button>
      {error ? <AvisoError mensaje={error} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
