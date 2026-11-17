/**
 * Enlaces externos de privacidad (#225, CA1):
 * - la Política de Tratamiento y Protección de Datos Personales de la UPC (Acuerdo 019);
 * - el módulo PQRS, la otra vía que da el Acuerdo para ejercer los derechos.
 *
 * Van en el login, en el Perfil, en la autorización del primer ingreso y en el formulario de
 * contacto. El texto legal es de la Universidad: aquí solo se enlaza, no se redacta.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';
import { URL_POLITICA_DATOS, URL_PQRS } from '@/utils/constantes';
import { abrirEnNavegador } from '@/utils/navegador';

type Props = {
  /** Texto pequeño encima del enlace, para decir de qué se trata. */
  nota?: string;
  /** Centra el texto: para el login y los bloques anchos. */
  centrado?: boolean;
  /** Añade el enlace al módulo PQRS, para ejercer los derechos por la otra vía del Acuerdo. */
  conPqrs?: boolean;
};

export function EnlacePoliticaDatos({ nota, centrado = false, conPqrs = false }: Props) {
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
      {conPqrs ? (
        <Button
          mode="text"
          icon="email-outline"
          onPress={() => abrir(URL_PQRS, 'el módulo PQRS')}
          contentStyle={estilos.contenidoBoton}
          labelStyle={estilos.etiqueta}
          accessibilityRole="link"
          accessibilityLabel="Módulo PQRS de la Universidad, para ejercer tus derechos sobre los datos personales"
        >
          Ejercer mis derechos por PQRS
        </Button>
      ) : null}
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
