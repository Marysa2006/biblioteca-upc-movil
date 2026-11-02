/**
 * Formulario de inicio de sesión (HU-05): usuario institucional y contraseña.
 * Solo valida y entrega las credenciales: la pantalla llama a useIniciarSesion()
 * y muestra el error de la API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
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

/**
 * Con la letra ampliada por encima de este factor, el sufijo pasa debajo del campo
 * (mismo umbral que la cuadrícula de Inicio).
 */
const ESCALA_LETRA_GRANDE = 1.3;

export function FormularioLogin({ enviando, onEnviar }: Props) {
  const [verContrasena, setVerContrasena] = useState(false);
  // Con letra muy grande, el sufijo dentro del campo dejaría poco espacio para escribir el usuario.
  const sufijoAbajo = useWindowDimensions().fontScale > ESCALA_LETRA_GRANDE;
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
              right={sufijoAbajo ? undefined : <TextInput.Affix text={`@${DOMINIO_CORREO}`} />}
              accessibilityLabel={`Correo institucional, usuario sin @${DOMINIO_CORREO}`}
            />
            {sufijoAbajo ? (
              <HelperText type="info">{`Se completa con @${DOMINIO_CORREO}`}</HelperText>
            ) : null}
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
              onSubmitEditing={() => enviar()}
              right={
                <TextInput.Icon
                  icon={verContrasena ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setVerContrasena((visible) => !visible)}
                  forceTextInputFocus={false}
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
        onPress={() => enviar()}
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
