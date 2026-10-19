/**
 * Formulario para crear o editar un espacio (HU-16): foto, nombre, descripción, capacidad,
 * horario y estado (CA1). Valida los datos y la foto (CA2) y entrega el Espacio sin id:
 * la pantalla guarda con useCrearEspacio() o useEditarEspacio() y muestra el error de la API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { espacio } from '@/theme';
import type { Espacio } from '@/types';
import { esquemaEspacio } from '@/utils/espacios';

import { SelectorFoto } from './SelectorFoto';

type DatosEspacio = Omit<Espacio, 'id'>;

type Props = {
  /** Sin espacio, el formulario crea uno nuevo. */
  espacioActual?: Espacio;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosEspacio) => void;
};

type CampoTexto = 'nombre' | 'descripcion' | 'capacidad' | 'horario';

const CAMPOS_TEXTO: {
  nombre: CampoTexto;
  etiqueta: string;
  multilinea?: boolean;
  ayuda?: string;
  numerico?: boolean;
}[] = [
  { nombre: 'nombre', etiqueta: 'Nombre del espacio', ayuda: 'Por ejemplo: Sala de Juntas' },
  { nombre: 'descripcion', etiqueta: 'Descripción', multilinea: true },
  { nombre: 'capacidad', etiqueta: 'Capacidad (personas)', numerico: true, ayuda: 'Por ejemplo: 12' },
  { nombre: 'horario', etiqueta: 'Horario', ayuda: 'Por ejemplo: lunes a viernes, 08:00 a 17:00' },
];

export function FormularioEspacio({ espacioActual, guardando, mensajeError, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(esquemaEspacio),
    defaultValues: {
      nombre: espacioActual?.nombre ?? '',
      descripcion: espacioActual?.descripcion ?? '',
      capacidad: espacioActual ? String(espacioActual.capacidad) : '',
      horario: espacioActual?.horario ?? '',
      foto: espacioActual?.foto ?? '',
      activo: espacioActual?.activo ?? true,
    },
  });

  const guardar = handleSubmit(({ foto, capacidad, ...resto }) =>
    onGuardar({
      ...resto,
      capacidad: Number(capacidad),
      // Sin foto, el campo no se envía (el tipo lo define opcional).
      ...(foto ? { foto } : {}),
    }),
  );

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <Controller
        control={control}
        name="foto"
        render={({ field: { value, onChange } }) => (
          <SelectorFoto valor={value} onCambiar={onChange} deshabilitado={guardando} />
        )}
      />

      {CAMPOS_TEXTO.map((campo) => (
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
                keyboardType={campo.numerico ? 'number-pad' : 'default'}
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
            ayuda="Un espacio inactivo no se ofrece a la comunidad para reservar."
            valor={value}
            onCambiar={onChange}
            deshabilitado={guardando}
          />
        )}
      />

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={guardar}
        loading={guardando}
        disabled={guardando || (espacioActual != null && !isDirty)}
        contentStyle={estilos.contenidoBoton}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={espacioActual ? 'Guardar cambios del espacio' : 'Crear espacio'}
      >
        {espacioActual ? 'Guardar cambios' : 'Crear espacio'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
