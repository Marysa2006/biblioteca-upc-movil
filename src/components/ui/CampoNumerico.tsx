/**
 * Campo de número entero: se escribe con el teclado numérico o se ajusta con − y +.
 * Solo acepta dígitos: si se pega o se escribe otra cosa, se descarta.
 * Los botones se desactivan en el mínimo y en el máximo. Entrega el número como texto
 * (los formularios lo validan con zod igual que antes).
 */
import { StyleSheet, View } from 'react-native';
import { HelperText, IconButton, TextInput } from 'react-native-paper';

import { colores, espacio } from '@/theme';

type Props = {
  etiqueta: string;
  /** El número como texto, o vacío. */
  valor: string;
  onCambiar: (valor: string) => void;
  onBlur?: () => void;
  minimo?: number;
  maximo?: number;
  placeholder?: string;
  mensajeError?: string;
  deshabilitado?: boolean;
};

export function CampoNumerico({
  etiqueta,
  valor,
  onCambiar,
  onBlur,
  minimo = 0,
  maximo,
  placeholder,
  mensajeError,
  deshabilitado = false,
}: Props) {
  const numero = valor === '' ? null : Number(valor);
  const puedeRestar = !deshabilitado && numero != null && numero > minimo;
  const puedeSumar = !deshabilitado && (maximo == null || numero == null || numero < maximo);

  const escribir = (texto: string) => onCambiar(texto.replace(/\D/g, ''));

  const mover = (paso: 1 | -1) => {
    const base = numero ?? (paso === 1 ? minimo - 1 : minimo);
    const siguiente = Math.max(minimo, maximo == null ? base + paso : Math.min(maximo, base + paso));
    onCambiar(String(siguiente));
  };

  return (
    <View>
      <View style={estilos.fila}>
        <IconButton
          icon="minus"
          mode="outlined"
          size={20}
          onPress={() => mover(-1)}
          disabled={!puedeRestar}
          style={estilos.boton}
          accessibilityLabel={`Restar uno a ${etiqueta.toLowerCase()}`}
        />
        <TextInput
          mode="outlined"
          label={etiqueta}
          placeholder={placeholder}
          value={valor}
          onChangeText={escribir}
          onBlur={onBlur}
          error={mensajeError != null}
          disabled={deshabilitado}
          keyboardType="number-pad"
          style={estilos.campo}
          accessibilityLabel={etiqueta}
        />
        <IconButton
          icon="plus"
          mode="outlined"
          size={20}
          onPress={() => mover(1)}
          disabled={!puedeSumar}
          style={estilos.boton}
          accessibilityLabel={`Sumar uno a ${etiqueta.toLowerCase()}`}
        />
      </View>
      <HelperText type="error" visible={mensajeError != null}>
        {mensajeError}
      </HelperText>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  campo: { flex: 1, backgroundColor: colores.superficie },
  // 44 × 44 de área táctil: IconButton de 20 con su relleno y sin margen extra.
  boton: { margin: 0, minWidth: 44, minHeight: 44 },
});
