/**
 * Formulario para crear o editar un servicio (HU-04): todos los campos de Servicio.
 * Solo valida y entrega los datos: la pantalla guarda con useCrearServicio() o useEditarServicio()
 * y muestra el error de la API (mensajeError).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { espacio } from '@/theme';
import type { Servicio } from '@/types';
import { esquemaServicio, ORDEN_CATEGORIAS } from '@/utils/servicios';

import { SelectorCategoria } from './SelectorCategoria';

type DatosServicio = Omit<Servicio, 'id'>;

type Props = {
  /** Sin servicio, el formulario crea uno nuevo. */
  servicio?: Servicio;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosServicio) => void;
};

type CampoTexto = 'nombre' | 'descripcion' | 'publico' | 'formaSolicitud' | 'horario';

const CAMPOS_TEXTO: { nombre: CampoTexto; etiqueta: string; multilinea?: boolean; ayuda?: string }[] = [
  { nombre: 'nombre', etiqueta: 'Nombre del servicio' },
  { nombre: 'descripcion', etiqueta: 'Descripción', multilinea: true },
  { nombre: 'publico', etiqueta: 'Público objetivo', ayuda: 'Por ejemplo: estudiantes y docentes' },
  { nombre: 'formaSolicitud', etiqueta: 'Forma de solicitud', multilinea: true },
  { nombre: 'horario', etiqueta: 'Horario', ayuda: 'Por ejemplo: lunes a viernes, 8:00 a. m. a 6:00 p. m.' },
];

export function FormularioServicio({ servicio, guardando, mensajeError, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(esquemaServicio),
    defaultValues: {
      nombre: servicio?.nombre ?? '',
      categoria: servicio?.categoria ?? ORDEN_CATEGORIAS[0],
      descripcion: servicio?.descripcion ?? '',
      publico: servicio?.publico ?? '',
      formaSolicitud: servicio?.formaSolicitud ?? '',
      horario: servicio?.horario ?? '',
      requiereCuenta: servicio?.requiereCuenta ?? false,
      activo: servicio?.activo ?? true,
    },
  });

  const guardar = handleSubmit((datos) => onGuardar(datos));

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <Controller
        control={control}
        name="categoria"
        render={({ field: { value, onChange } }) => (
          <SelectorCategoria
            valor={value}
            onCambiar={onChange}
            deshabilitado={guardando}
            mensajeError={errors.categoria?.message}
          />
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
        name="requiereCuenta"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Requiere cuenta institucional"
            ayuda="Solo la comunidad con cuenta puede solicitarlo."
            valor={value}
            onCambiar={onChange}
            deshabilitado={guardando}
          />
        )}
      />
      <Controller
        control={control}
        name="activo"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Activo"
            ayuda="Visible para la comunidad en Inicio y Servicios."
            valor={value}
            onCambiar={onChange}
            deshabilitado={guardando}
          />
        )}
      />

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={() => guardar()}
        loading={guardando}
        disabled={guardando || (servicio != null && !isDirty)}
        contentStyle={estilos.contenidoBoton}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={servicio ? 'Guardar cambios del servicio' : 'Crear servicio'}
      >
        {servicio ? 'Guardar cambios' : 'Crear servicio'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
