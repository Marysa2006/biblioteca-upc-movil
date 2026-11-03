/**
 * Formulario para crear o editar una línea de formación (HU-09): nombre, descripción y estado.
 * El nombre repetido se marca bajo su campo (CA2), antes de guardar y también si lo devuelve la
 * API. Solo entrega los datos: la pantalla guarda con useCrearLinea() o useEditarLinea().
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { espacio } from '@/theme';
import type { LineaFormacion } from '@/types';
import { crearEsquemaLinea, type DatosFormularioLinea } from '@/utils/lineas';

type Props = {
  lineas: LineaFormacion[];
  /** Sin línea, el formulario crea una nueva. */
  original?: LineaFormacion;
  guardando: boolean;
  /** Error general de la API, arriba del formulario. */
  mensajeError: string | null;
  /** Error de la API sobre el nombre (CA2): va bajo el campo. */
  errorNombre: string | null;
  onGuardar: (datos: DatosFormularioLinea) => void;
};

const CAMPOS: { nombre: 'nombre' | 'descripcion'; etiqueta: string; ayuda: string; maximo: number }[] = [
  { nombre: 'nombre', etiqueta: 'Nombre de la línea', ayuda: 'Por ejemplo: Normas APA 7', maximo: 80 },
  { nombre: 'descripcion', etiqueta: 'Descripción', ayuda: 'Qué aprende el grupo en la capacitación.', maximo: 300 },
];

export function FormularioLinea({ lineas, original, guardando, mensajeError, errorNombre, onGuardar }: Props) {
  const [esquema] = useState(() => crearEsquemaLinea(lineas, original?.id));
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: original?.nombre ?? '',
      descripcion: original?.descripcion ?? '',
      activa: original?.activa ?? true,
    },
  });

  // Si la API dice que el nombre ya existe (otra persona la creó mientras tanto), va bajo el campo.
  useEffect(() => {
    if (errorNombre) setError('nombre', { type: 'api', message: errorNombre });
  }, [errorNombre, setError]);

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
                multiline={campo.nombre === 'descripcion'}
                maxLength={campo.maximo}
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
        name="activa"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Activa"
            ayuda="Una línea activa se ofrece en el formulario para solicitar capacitación."
            valor={value}
            onCambiar={onChange}
            deshabilitado={guardando}
          />
        )}
      />

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={() => handleSubmit(onGuardar)()}
        loading={guardando}
        disabled={guardando || (original != null && !isDirty)}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={original ? 'Guardar cambios de la línea' : 'Crear línea de formación'}
      >
        {original ? 'Guardar cambios' : 'Crear línea'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
