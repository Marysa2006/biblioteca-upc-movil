/**
 * Campo de texto del formulario de parámetros (HU-28), con su error debajo (CA2).
 * Lee el formulario con useFormContext: va dentro del FormProvider de la pantalla.
 */
import { Controller, useFormContext, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import type { FormularioParametros } from '@/utils/parametros';

type Props = {
  nombre: Path<FormularioParametros>;
  etiqueta: string;
  placeholder?: string;
  /** Lo que lee el lector de pantalla; por defecto, la etiqueta. */
  descripcionAccesible?: string;
  teclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  largoMaximo?: number;
  deshabilitado?: boolean;
};

export function CampoParametro({
  nombre,
  etiqueta,
  placeholder,
  descripcionAccesible,
  teclado,
  multilinea,
  largoMaximo,
  deshabilitado,
}: Props) {
  const { control } = useFormContext<FormularioParametros>();

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
            maxLength={largoMaximo}
            accessibilityLabel={descripcionAccesible ?? etiqueta}
          />
          <HelperText type="error" visible={error != null}>
            {error?.message}
          </HelperText>
        </View>
      )}
    />
  );
}
