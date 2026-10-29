/**
 * Campo de un formulario de reserva (HU-18 y HU-19), con su error debajo.
 * Genérico: sirve para cualquier formulario de react-hook-form con valores de texto.
 * Según `tipo`, se escribe (texto), se elige en el calendario (fecha), en el reloj (hora)
 * o se ajusta con − y + (número). Las fechas y horas nunca se escriben a mano.
 */
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { View, type KeyboardTypeOptions } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { CampoHora, CampoNumerico } from '@/components/ui';

type Props<T extends FieldValues> = {
  control: Control<T>;
  nombre: Path<T>;
  etiqueta: string;
  /** Por defecto, texto. */
  tipo?: 'texto' | 'fecha' | 'hora' | 'numero';
  placeholder?: string;
  teclado?: KeyboardTypeOptions;
  multilinea?: boolean;
  /** Fecha: por qué no se puede elegir un día, y el primer y último mes del calendario. */
  motivoNoElegible?: (fecha: string) => string | null;
  mesMinimo?: string;
  mesMaximo?: string;
  /** Hora: 30 (por defecto) o 60 minutos. */
  pasoMinutos?: 30 | 60;
  /** Número: los límites de − y +. */
  minimo?: number;
  maximo?: number;
  deshabilitado: boolean;
};

export function CampoFormulario<T extends FieldValues>({
  control,
  nombre,
  etiqueta,
  tipo = 'texto',
  placeholder,
  teclado,
  multilinea,
  motivoNoElegible = () => null,
  mesMinimo = '',
  mesMaximo = '',
  pasoMinutos,
  minimo,
  maximo,
  deshabilitado,
}: Props<T>) {
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
              motivoNoElegible={motivoNoElegible}
              mesMinimo={mesMinimo}
              mesMaximo={mesMaximo}
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
              pasoMinutos={pasoMinutos}
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
              placeholder={placeholder}
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
              accessibilityLabel={etiqueta}
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
