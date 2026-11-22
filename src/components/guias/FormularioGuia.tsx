/**
 * Formulario para crear o editar una guía de la biblioteca (#258).
 * Título, descripción y el formato: un enlace (PDF o Drive) o el contenido escrito aquí. El
 * enlace tiene que ser https; si no, el error sale bajo el campo (CA3).
 * Solo valida y entrega los datos: la pantalla guarda con useEditarGuia() y muestra el error de
 * la API (mensajeError).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import type { DatosGuia } from '@/api/guias';
import { colores, espacio, fuentes } from '@/theme';
import type { Guia } from '@/types';
import {
  datosDeGuia,
  esquemaGuia,
  formatoDe,
  FORMATOS_GUIA,
  type FormatoGuia,
  type FormularioGuia as ValoresGuia,
} from '@/utils/guias';

type Props = {
  /** Sin guía, el formulario crea una nueva. */
  guia?: Guia;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosGuia) => void;
};

const FORMATOS: FormatoGuia[] = ['enlace', 'escrita'];

export function FormularioGuia({ guia, guardando, mensajeError, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ValoresGuia>({
    resolver: zodResolver(esquemaGuia),
    defaultValues: {
      formato: guia ? formatoDe(guia) : 'enlace',
      titulo: guia?.titulo ?? '',
      descripcion: guia?.descripcion ?? '',
      enlace: guia?.enlace ?? '',
      contenido: guia?.contenido ?? '',
      publicado: guia?.publicado ?? true,
    },
  });
  // useWatch y no watch(): watch no es compatible con el React Compiler del proyecto.
  const conEnlace = useWatch({ control, name: 'formato' }) === 'enlace';

  const guardar = handleSubmit((valores) => onGuardar(datosDeGuia(esquemaGuia.parse(valores))));

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <Controller
        control={control}
        name="titulo"
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label="Título"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.titulo != null}
              disabled={guardando}
              accessibilityLabel="Título"
            />
            <HelperText type="error" visible={errors.titulo != null}>
              {errors.titulo?.message}
            </HelperText>
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
              label="Descripción"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.descripcion != null}
              disabled={guardando}
              multiline
              accessibilityLabel="Descripción"
            />
            <HelperText type="error" visible={errors.descripcion != null}>
              {errors.descripcion?.message ?? 'Una línea que diga de qué trata la guía.'}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="formato"
        render={({ field: { value, onChange } }) => (
          <View style={estilos.grupo}>
            <Text variant="labelLarge" style={estilos.etiquetaGrupo}>
              Cómo se lee
            </Text>
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={FORMATOS.map((formato) => ({
                value: formato,
                label: FORMATOS_GUIA[formato].nombre,
                icon: FORMATOS_GUIA[formato].icono,
                disabled: guardando,
                accessibilityLabel: `Formato ${FORMATOS_GUIA[formato].nombre}`,
              }))}
            />
          </View>
        )}
      />

      {conEnlace ? (
        <Controller
          control={control}
          name="enlace"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label="Enlace de la guía"
                placeholder="https://drive.google.com/…"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.enlace != null}
                disabled={guardando}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Enlace de la guía"
              />
              <HelperText type={errors.enlace ? 'error' : 'info'} visible>
                {errors.enlace?.message ??
                  'El PDF o el Drive de la guía. La comunidad lo abre en el navegador, con internet.'}
              </HelperText>
            </View>
          )}
        />
      ) : (
        <Controller
          control={control}
          name="contenido"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label="Contenido"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.contenido != null}
                disabled={guardando}
                multiline
                style={estilos.contenido}
                accessibilityLabel="Contenido de la guía"
              />
              <HelperText type={errors.contenido ? 'error' : 'info'} visible>
                {errors.contenido?.message ??
                  'La primera línea es el título; las que empiezan con "1." son pasos. Se lee sin conexión.'}
              </HelperText>
            </View>
          )}
        />
      )}

      <Controller
        control={control}
        name="publicado"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Publicada"
            ayuda="Visible para la comunidad en Catálogo → Guías."
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
        disabled={guardando || (guia != null && !isDirty)}
        contentStyle={estilos.contenidoBoton}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={guia ? 'Guardar cambios de la guía' : 'Crear guía'}
      >
        {guia ? 'Guardar cambios' : 'Crear guía'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  grupo: { gap: espacio.s, marginBottom: espacio.s },
  etiquetaGrupo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  contenido: { minHeight: 160 },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
