/**
 * Formulario para crear o editar un tema de asesoría (HU-13): nombre, descripción y estado.
 * Valida que el nombre no se repita. Solo entrega los datos: la pantalla guarda con
 * useGuardarTema() y muestra el error de la API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { espacio } from '@/theme';
import type { TemaAsesoria } from '@/types';
import { crearEsquemaTema, type DatosFormularioTema } from '@/utils/jornadas';

type Props = {
  temas: TemaAsesoria[];
  /** Sin tema, el formulario crea uno nuevo. */
  original?: TemaAsesoria;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosFormularioTema) => void;
};

const CAMPOS: { nombre: 'nombre' | 'descripcion'; etiqueta: string; ayuda: string; multilinea?: boolean }[] = [
  { nombre: 'nombre', etiqueta: 'Nombre del tema', ayuda: 'Por ejemplo: Normas APA 7' },
  {
    nombre: 'descripcion',
    etiqueta: 'Descripción',
    ayuda: 'Qué aprende la persona en la asesoría.',
    multilinea: true,
  },
];

export function FormularioTema({ temas, original, guardando, mensajeError, onGuardar }: Props) {
  const [esquema] = useState(() => crearEsquemaTema(temas, original?.id));
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: original?.nombre ?? '',
      descripcion: original?.descripcion ?? '',
      activo: original?.activo ?? true,
    },
  });

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      {CAMPOS.map((campo) => (
        <Controller
          key={campo.nombre}
          control={control}
          name={campo.nombre}
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label={campo.etiqueta}
                placeholder={campo.ayuda}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors[campo.nombre] != null}
                disabled={guardando}
                multiline={campo.multilinea}
                maxLength={campo.nombre === 'nombre' ? 80 : 300}
                accessibilityLabel={campo.etiqueta}
              />
              <HelperText type="error" visible={errors[campo.nombre] != null}>
                {errors[campo.nombre]?.message}
              </HelperText>
            </View>
          )}
        />
      ))}

      <Controller
        control={control}
        name="activo"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Activo"
            ayuda="Un tema inactivo no se ofrece a la comunidad para agendar."
            valor={value}
            onCambiar={onChange}
            deshabilitado={guardando}
          />
        )}
      />

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={handleSubmit(onGuardar)}
        loading={guardando}
        disabled={guardando || (original != null && !isDirty)}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={original ? 'Guardar cambios del tema' : 'Crear tema'}
      >
        {original ? 'Guardar cambios' : 'Crear tema'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
