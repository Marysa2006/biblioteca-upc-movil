/**
 * Datos de contacto editables del perfil (HU-06, CA3 y CA4): teléfono y dirección.
 * Solo valida y entrega los datos: la pantalla llama a useActualizarPerfil() y muestra
 * la confirmación o el error de la API (mensajeError).
 *
 * La dirección es provisional: no está en el esquema del Backend (ver src/types).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { DatosEditablesPerfil, Perfil } from '@/types';
import { esquemaPerfil, LARGO_MAXIMO_DIRECCION, limpiarTelefono } from '@/utils/perfil';

type Props = {
  perfil: Perfil;
  guardando: boolean;
  /** Error de la API al guardar (CA4); null si no hay. */
  mensajeError: string | null;
  onGuardar: (datos: DatosEditablesPerfil) => void;
};

export function FormularioPerfil({ perfil, guardando, mensajeError, onGuardar }: Props) {
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
    onGuardar({ telefono: limpiarTelefono(datos.telefono), direccion: datos.direccion }),
  );

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Icon source="card-account-phone-outline" size={24} color={colores.primario} />
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          Datos de contacto
        </Text>
      </View>

      {perfil.telefono ? null : (
        <View style={estilos.faltante}>
          <Icon source="information-outline" size={20} color={colores.primarioOscuro} />
          <Text variant="bodyMedium" style={estilos.textoFaltante}>
            Completa tu teléfono para recibir avisos de tus solicitudes.
          </Text>
        </View>
      )}

      {mensajeError ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Icon source="alert-circle-outline" size={20} color={coloresEstado.rechazada.texto} />
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {mensajeError}
          </Text>
        </View>
      ) : null}

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
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('direccion')}
              right={<TextInput.Icon icon="phone-outline" accessible={false} importantForAccessibility="no" />}
              accessibilityLabel="Teléfono celular, entre 7 y 10 dígitos"
            />
            <HelperText type="error" visible={errors.telefono != null}>
              {errors.telefono?.message}
            </HelperText>
          </View>
        )}
      />

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
              onSubmitEditing={guardar}
              accessibilityLabel="Dirección, opcional"
            />
            <HelperText type="error" visible={errors.direccion != null}>
              {errors.direccion?.message}
            </HelperText>
          </View>
        )}
      />

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={guardar}
        loading={guardando}
        disabled={guardando || !isDirty}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Guardar cambios"
      >
        Guardar cambios
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, marginBottom: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  faltante: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    marginBottom: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoFaltante: { flex: 1, color: colores.texto },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    marginBottom: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  textoAviso: { flex: 1, color: coloresEstado.rechazada.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
});
