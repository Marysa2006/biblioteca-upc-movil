/**
 * Enlace externo de privacidad (#225, CA1): la Política de Tratamiento y Protección de Datos
 * Personales de la UPC (Acuerdo 019). El enlace al módulo PQRS se quitó en la revisión de la 1.1:
 * es un servicio de la Universidad que la app no está autorizada a usar; para ejercer los
 * derechos queda el correo de tratamiento de datos (Perfil).
 *
 * Van en el login, en el Perfil, en la autorización del primer ingreso y en el formulario de
 * contacto. El texto legal es de la Universidad: aquí solo se enlaza, no se redacta.
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
  const [error, setError] = useState<string | null>(null);

  const abrir = (url: string, queEs: string) => {
    setError(null);
    abrirEnNavegador(url).catch(() => setError(`No se pudo abrir ${queEs}. Revisa tu conexión e inténtalo de nuevo.`));
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
        onPress={() => abrir(URL_POLITICA_DATOS, 'la política')}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.etiqueta}
        accessibilityRole="link"
        accessibilityLabel="Tratamiento de datos personales: abre la política de la Universidad Popular del Cesar"
      >
        Tratamiento de datos personales
      </Button>
      {error ? (
        <Text variant="bodySmall" style={[estilos.error, alineacion]} accessibilityLiveRegion="polite">
          {error}
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
