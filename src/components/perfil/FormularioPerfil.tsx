/**
 * Datos de contacto editables del perfil (HU-06, CA3 y CA4): teléfono y dirección.
 * Solo valida y entrega los datos: la pantalla llama a useActualizarPerfil() y muestra
 * la confirmación o el error de la API (mensajeError).
 *
 * #225 (CA3): antes de los campos dice para qué se usan y enlaza la política de la UPC, porque
 * aquí es donde la persona escribe datos que no vienen de su cuenta institucional.
 *
 * La dirección es provisional: no está en el Backend, así que solo aparece con datos de prueba
 * (`conDireccion`).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { NotaDatosPersonales } from '@/components/privacidad/NotaDatosPersonales';
import { AvisoError } from '@/components/ui';
import { espacio } from '@/theme';
import type { DatosEditablesPerfil, Perfil } from '@/types';
import { esquemaPerfil, LARGO_MAXIMO_DIRECCION, limpiarTelefono } from '@/utils/perfil';

/** Para qué se usan los datos de contacto (#225, CA3), con lo que respondió la bibliotecóloga. */
const PARA_QUE_SIRVEN = 'Tu teléfono lo usa la biblioteca para confirmar tus solicitudes.';
const DIRECCION_OPCIONAL = ' La dirección es opcional.';
const POLITICA = ' El tratamiento de estos datos se rige por la política de la Universidad.';

type Props = {
  perfil: Perfil;
  /** Si se muestra y se edita la dirección. */
  conDireccion: boolean;
  guardando: boolean;
  /** Error de la API al guardar (CA4); null si no hay. */
  mensajeError: string | null;
  onGuardar: (datos: DatosEditablesPerfil) => void;
  onCancelar: () => void;
};

export function FormularioPerfil({
  perfil,
  conDireccion,
  guardando,
  mensajeError,
  onGuardar,
  onCancelar,
}: Props) {
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(esquemaPerfil),
    // values (y no defaultValues): al guardar, el formulario toma lo guardado y deja de estar "sucio".
    values: { telefono: perfil.telefono ?? '', direccion: perfil.direccion ?? '' },
  });

  const guardar = handleSubmit((datos) =>
    onGuardar({
      telefono: limpiarTelefono(datos.telefono),
      ...(conDireccion ? { direccion: datos.direccion } : {}),
    }),
  );

  return (
    <View style={estilos.formulario}>
      {mensajeError ? (
        <View style={estilos.margenAviso}>
          <AvisoError mensaje={mensajeError} />
        </View>
      ) : null}

      <NotaDatosPersonales
        mensaje={`${PARA_QUE_SIRVEN}${conDireccion ? DIRECCION_OPCIONAL : ''}${POLITICA}`}
      />

      <Controller
        control={control}
        name="telefono"
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label="Teléfono celular"
              placeholder="3001234567"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.telefono != null}
              disabled={guardando}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType={conDireccion ? 'next' : 'done'}
              submitBehavior={conDireccion ? 'submit' : 'blurAndSubmit'}
              onSubmitEditing={() => (conDireccion ? setFocus('direccion') : guardar())}
              right={
                <TextInput.Icon
                  icon="phone-outline"
                  accessible={false}
                  importantForAccessibility="no"
                />
              }
              accessibilityLabel="Teléfono celular, 10 dígitos que empiezan por 3"
            />
            <HelperText type="error" visible={errors.telefono != null}>
              {errors.telefono?.message}
            </HelperText>
          </View>
        )}
      />

      {conDireccion ? (
        <Controller
          control={control}
          name="direccion"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label="Dirección (opcional)"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.direccion != null}
                disabled={guardando}
                maxLength={LARGO_MAXIMO_DIRECCION}
                autoComplete="street-address"
                textContentType="fullStreetAddress"
                returnKeyType="done"
                onSubmitEditing={() => guardar()}
                accessibilityLabel="Dirección, opcional"
              />
              <HelperText type="error" visible={errors.direccion != null}>
                {errors.direccion?.message}
              </HelperText>
            </View>
          )}
        />
      ) : null}

      <View style={estilos.acciones}>
        <Button
          mode="text"
          onPress={onCancelar}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Cancelar la edición"
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          icon="content-save-outline"
          onPress={() => guardar()}
          loading={guardando}
          disabled={guardando || !isDirty}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Guardar cambios"
        >
          Guardar cambios
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: espacio.s },
  margenAviso: { marginBottom: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
