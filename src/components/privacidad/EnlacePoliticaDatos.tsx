/**
 * Enlace a la Política de Tratamiento y Protección de Datos Personales de la UPC (#225, CA1).
 * Va en el login, en el Perfil, en la autorización del primer ingreso y en el formulario de
 * contacto; abre el Acuerdo 019 en el navegador integrado.
 * El texto legal es de la Universidad: aquí solo se enlaza, no se redacta.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';
import { URL_POLITICA_DATOS } from '@/utils/constantes';
import { abrirEnNavegador } from '@/utils/navegador';

type Props = {
  /** Texto pequeño encima del enlace, para decir de qué se trata. */
  nota?: string;
  /** Centra el texto: para el login y los bloques anchos. */
  centrado?: boolean;
};

export function EnlacePoliticaDatos({ nota, centrado = false }: Props) {
  const [error, setError] = useState(false);

  const abrir = () => {
    setError(false);
    abrirEnNavegador(URL_POLITICA_DATOS).catch(() => setError(true));
  };

  const alineacion = centrado ? estilos.centrado : null;

  return (
    <View style={estilos.bloque}>
      {nota ? (
        <Text variant="bodySmall" style={[estilos.nota, alineacion]}>
          {nota}
        </Text>
      ) : null}
      <Button
        mode="text"
        icon="shield-check-outline"
        onPress={abrir}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.etiqueta}
        accessibilityRole="link"
        accessibilityLabel="Tratamiento de datos personales: abre la política de la Universidad Popular del Cesar"
      >
        Tratamiento de datos personales
      </Button>
      {error ? (
        <Text variant="bodySmall" style={[estilos.error, alineacion]} accessibilityLiveRegion="polite">
          No se pudo abrir la política. Revisa tu conexión e inténtalo de nuevo.
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: espacio.xs },
  nota: { color: colores.textoSecundario },
  centrado: { textAlign: 'center' },
  etiqueta: { color: colores.primario },
  // Sin padding vertical: el enlace va dentro de tarjetas que ya tienen su propio espacio.
  contenidoBoton: { paddingVertical: 0 },
  error: { color: colores.error },
});
