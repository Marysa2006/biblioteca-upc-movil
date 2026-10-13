/**
 * Formulario de inicio de sesión (HU-05): usuario institucional y contraseña.
 * Solo valida y entrega las credenciales: la pantalla llama a useIniciarSesion()
 * y muestra el error de la API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { espacio } from '@/theme';
import { aCorreoInstitucional, esquemaLogin } from '@/utils/autenticacion';
import { DOMINIO_CORREO } from '@/utils/constantes';

type Credenciales = { correo: string; contrasena: string };

type Props = {
  enviando: boolean;
  /** Recibe el correo ya completo (usuario@unicesar.edu.co), como lo espera useIniciarSesion(). */
  onEnviar: (credenciales: Credenciales) => void;
};

/** Lleva el botón del ojo a 44 px de área táctil. */
const AREA_OJO = { top: espacio.s, bottom: espacio.s, left: espacio.s, right: espacio.s };

export function FormularioLogin({ enviando, onEnviar }: Props) {
  const [verContrasena, setVerContrasena] = useState(false);
  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { usuario: '', contrasena: '' },
  });

  const enviar = handleSubmit((datos) =>
    onEnviar({ correo: aCorreoInstitucional(datos.usuario), contrasena: datos.contrasena }),
  );

  return (
    <View style={estilos.formulario}>
      <Controller
        control={control}
        name="usuario"
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label="Correo institucional"
              placeholder="tu.usuario"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.usuario != null}
              disabled={enviando}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('contrasena')}
              right={<TextInput.Affix text={`@${DOMINIO_CORREO}`} />}
              accessibilityLabel={`Correo institucional, usuario sin @${DOMINIO_CORREO}`}
            />
            <HelperText type="error" visible={errors.usuario != null}>
              {errors.usuario?.message}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="contrasena"
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label="Contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.contrasena != null}
              disabled={enviando}
              secureTextEntry={!verContrasena}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={enviar}
              right={
                <TextInput.Icon
                  icon={verContrasena ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setVerContrasena((visible) => !visible)}
                  forceTextInputFocus={false}
                  hitSlop={AREA_OJO}
                  accessibilityRole="button"
                  accessibilityLabel={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                />
              }
              accessibilityLabel="Contraseña"
            />
            <HelperText type="error" visible={errors.contrasena != null}>
              {errors.contrasena?.message}
            </HelperText>
          </View>
        )}
      />

      <Button
        mode="contained"
        icon="arrow-right"
        onPress={enviar}
        loading={enviando}
        disabled={enviando}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión"
      >
        Iniciar sesión
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  // row-reverse deja la flecha a la derecha del texto, como en el mockup.
  contenidoBoton: { flexDirection: 'row-reverse', paddingVertical: espacio.xs },
});
