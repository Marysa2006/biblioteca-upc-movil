/**
 * Campo del formulario de parámetros (HU-28), con su error debajo (CA2).
 * Lee el formulario con useFormContext: va dentro del FormProvider de la pantalla.
 * Según `tipo`, se escribe (texto), se elige en el calendario (fecha), en el reloj (hora)
 * o se ajusta con − y + (número). Las fechas y horas nunca se escriben a mano.
 */
import { useState } from 'react';
import { Controller, useFormContext, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { CampoHora, CampoNumerico } from '@/components/ui';
import { sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import type { FormularioParametros } from '@/utils/parametros';

/** Los parámetros se configuran desde un año atrás hasta dos años adelante. */
const MESES_ATRAS = 12;
const MESES_ADELANTE = 24;

type Props = {
  nombre: Path<FormularioParametros>;
  etiqueta: string;
  /** Por defecto, texto. */
  tipo?: 'texto' | 'fecha' | 'hora' | 'numero';
  placeholder?: string;
  /** Lo que lee el lector de pantalla; por defecto, la etiqueta (solo en texto). */
  descripcionAccesible?: string;
  teclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  largoMaximo?: number;
  /** Solo en número. */
  minimo?: number;
  maximo?: number;
  deshabilitado?: boolean;
};

export function CampoParametro({
  nombre,
  etiqueta,
  tipo = 'texto',
  placeholder,
  descripcionAccesible,
  teclado,
  multilinea,
  largoMaximo,
  minimo,
  maximo,
  deshabilitado,
}: Props) {
  const { control } = useFormContext<FormularioParametros>();
  const [hoy] = useState(hoyISO);

  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => {
        const texto = typeof value === 'string' ? value : '';

        if (tipo === 'fecha') {
          return (
            <SelectorFecha
              etiqueta={etiqueta}
              valor={texto}
              onCambiar={onChange}
              motivoNoElegible={() => null}
              mesMinimo={sumarMeses(hoy, -MESES_ATRAS)}
              mesMaximo={sumarMeses(hoy, MESES_ADELANTE)}
              mensajeError={error?.message}
              deshabilitado={deshabilitado}
            />
          );
        }
        if (tipo === 'hora') {
          return (
            <CampoHora
              etiqueta={etiqueta}
              valor={texto}
              onCambiar={onChange}
              mensajeError={error?.message}
              deshabilitado={deshabilitado}
            />
          );
        }
        if (tipo === 'numero') {
          return (
            <CampoNumerico
              etiqueta={etiqueta}
              valor={texto}
              onCambiar={onChange}
              onBlur={onBlur}
              minimo={minimo}
              maximo={maximo}
              mensajeError={error?.message}
              deshabilitado={deshabilitado}
            />
          );
        }
        return (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label={etiqueta}
              placeholder={placeholder}
              value={texto}
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
        );
      }}
    />
  );
}
