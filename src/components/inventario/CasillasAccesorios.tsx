/**
 * Casillas de los accesorios entregados o recibidos (HU-23). Toda la fila se presiona y el
 * lector de pantalla la anuncia como casilla marcada o sin marcar.
 */
import { StyleSheet, View } from 'react-native';
import { Checkbox, HelperText, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

type Props = {
  titulo: string;
  /** Los accesorios que se pueden marcar. */
  opciones: string[];
  marcados: string[];
  onCambiar: (marcados: string[]) => void;
  /** Debajo: un aviso, por ejemplo los que faltan. */
  aviso?: string;
  deshabilitado?: boolean;
};

export function CasillasAccesorios({ titulo, opciones, marcados, onCambiar, aviso, deshabilitado = false }: Props) {
  const alternar = (accesorio: string) =>
    onCambiar(marcados.includes(accesorio) ? marcados.filter((a) => a !== accesorio) : [...marcados, accesorio]);

  return (
    <View style={estilos.grupo}>
      <Text variant="labelLarge" style={estilos.titulo}>
        {titulo}
      </Text>
      {opciones.length === 0 ? (
        <Text variant="bodyMedium" style={estilos.ayuda}>
          Esta tablet no tiene accesorios registrados.
        </Text>
      ) : (
        opciones.map((accesorio) => (
          <Checkbox.Item
            key={accesorio}
            label={accesorio}
            status={marcados.includes(accesorio) ? 'checked' : 'unchecked'}
            onPress={() => alternar(accesorio)}
            disabled={deshabilitado}
            mode="android"
            position="leading"
            labelStyle={estilos.etiqueta}
            style={estilos.fila}
            accessibilityLabel={`${accesorio}, ${marcados.includes(accesorio) ? 'marcado' : 'sin marcar'}`}
          />
        ))
      )}
      <HelperText type="info" visible={Boolean(aviso)}>
        {aviso ?? ''}
      </HelperText>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: 0 },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita, marginBottom: espacio.xs },
  ayuda: { color: colores.textoSecundario },
  fila: { paddingHorizontal: 0, minHeight: 44 },
  etiqueta: { color: colores.texto, textAlign: 'left' },
});
