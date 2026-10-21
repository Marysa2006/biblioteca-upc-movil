/**
 * Campo de texto de un formulario de reserva (HU-18 y HU-19), con su error debajo.
 * Genérico: sirve para cualquier formulario de react-hook-form con valores de texto.
 */
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

type Props<T extends FieldValues> = {
  control: Control<T>;
  nombre: Path<T>;
  etiqueta: string;
  placeholder?: string;
  teclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  deshabilitado: boolean;
};

export function CampoFormulario<T extends FieldValues>({
  control,
  nombre,
  etiqueta,
  placeholder,
  teclado,
  multilinea,
  deshabilitado,
}: Props<T>) {
  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
        <View>
          <TextInput
            ref={ref}
            mode="outlined"
            label={etiqueta}
            placeholder={placeholder}
            value={typeof value === 'string' ? value : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error != null}
            disabled={deshabilitado}
            keyboardType={teclado}
            multiline={multilinea}
            accessibilityLabel={etiqueta}
          />
          <HelperText type="error" visible={error != null}>
            {error?.message}
          </HelperText>
        </View>
      )}
    />
  );
}
