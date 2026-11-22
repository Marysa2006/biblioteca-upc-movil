/**
 * Formulario de una foto del carrusel de Inicio (#290): la foto (recortada a 16:9), qué muestra
 * y si está publicada. Sin foto o sin descripción no se guarda (CA5); la foto inválida (formato,
 * peso o tamaño) la rechaza SelectorFoto antes de aceptarla.
 * Solo valida y entrega los datos: la pantalla guarda con useGuardarFotoInicio() y muestra el error
 * de la API (mensajeError), como el del máximo de fotos publicadas (CA4).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { SelectorFoto } from '@/components/espacios/SelectorFoto';
import { AvisoError, FilaInterruptor } from '@/components/ui';
import type { DatosFotoInicio } from '@/hooks/useFotosInicio';
import { espacio } from '@/theme';
import type { FotoInicio } from '@/types';
import {
  esquemaFotoInicio,
  fuenteFotoInicio,
  LARGO_MAXIMO_DESCRIPCION_FOTO,
  MAXIMO_FOTOS_INICIO,
  PREFIJO_FOTO_APP,
  type ValoresFotoInicio,
} from '@/utils/inicio';

type Props = {
  /** Sin foto, el formulario agrega una nueva. */
  foto?: FotoInicio;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosFotoInicio) => void;
};

export function FormularioFotoInicio({ foto, guardando, mensajeError, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ValoresFotoInicio>({
    resolver: zodResolver(esquemaFotoInicio),
    defaultValues: {
      imagen: foto?.imagen ?? '',
      descripcion: foto?.descripcion ?? '',
      publicada: foto?.publicada ?? true,
    },
  });
  // useWatch y no watch(): watch no es compatible con el React Compiler del proyecto.
  const imagen = useWatch({ control, name: 'imagen' });

  const guardar = handleSubmit((valores) => onGuardar(esquemaFotoInicio.parse(valores)));

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <Controller
        control={control}
        name="imagen"
        render={({ field: { value, onChange } }) => (
          <View>
            <SelectorFoto
              valor={value}
              onCambiar={onChange}
              deshabilitado={guardando}
              aspecto={[16, 9]}
              descripcion="Vista previa de la foto de Inicio"
              // Las fotos que trae la app (app://…) no son una URI: se muestran con su require.
              fuente={imagen.startsWith(PREFIJO_FOTO_APP) ? fuenteFotoInicio(imagen) : undefined}
            />
            <View accessibilityLiveRegion="polite">
              <HelperText type="error" visible={errors.imagen != null}>
                {errors.imagen?.message}
              </HelperText>
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="descripcion"
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label="Qué muestra la foto"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.descripcion != null}
              disabled={guardando}
              multiline
              maxLength={LARGO_MAXIMO_DESCRIPCION_FOTO}
              accessibilityLabel="Qué muestra la foto"
            />
            <View accessibilityLiveRegion="polite">
              <HelperText type={errors.descripcion ? 'error' : 'info'} visible>
                {errors.descripcion?.message ??
                  `${value.length} de ${LARGO_MAXIMO_DESCRIPCION_FOTO}. La lee el lector de pantalla, por ejemplo: "Sala de lectura con estudiantes en las mesas".`}
              </HelperText>
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="publicada"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Publicada"
            ayuda={`Se ve en el carrusel de Inicio. Hasta ${MAXIMO_FOTOS_INICIO} fotos publicadas a la vez.`}
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
        disabled={guardando || (foto != null && !isDirty)}
        contentStyle={estilos.contenidoBoton}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={foto ? 'Guardar cambios de la foto' : 'Agregar la foto'}
      >
        {foto ? 'Guardar cambios' : 'Agregar foto'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
