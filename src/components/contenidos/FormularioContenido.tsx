/**
 * Formulario para crear o editar un aviso o un informativo (HU-04).
 * Solo valida y entrega los datos: la pantalla guarda con useCrearContenido() o useEditarContenido()
 * y muestra el error de la API (mensajeError). Las fechas de vigencia solo aplican a los avisos.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { Contenido } from '@/types';
import {
  esquemaContenido,
  TIPOS_CONTENIDO,
  TIPOS_EDITABLES,
  type TipoEditable,
} from '@/utils/contenidos';

type DatosContenido = Omit<Contenido, 'id' | 'orden'>;

type Props = {
  /** Sin contenido, el formulario crea uno nuevo. */
  contenido?: Contenido;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosContenido) => void;
};

const esEditable = (tipo: Contenido['tipo']): tipo is TipoEditable =>
  (TIPOS_EDITABLES as readonly string[]).includes(tipo);

export function FormularioContenido({ contenido, guardando, mensajeError, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(esquemaContenido),
    defaultValues: {
      tipo: contenido && esEditable(contenido.tipo) ? contenido.tipo : 'aviso',
      titulo: contenido?.titulo ?? '',
      descripcion: contenido?.descripcion ?? '',
      publicado: contenido?.publicado ?? true,
      fechaInicio: contenido?.fechaInicio ?? '',
      fechaFin: contenido?.fechaFin ?? '',
    },
  });
  // useWatch y no watch(): watch no es compatible con el React Compiler del proyecto.
  const esAviso = useWatch({ control, name: 'tipo' }) === 'aviso';

  const guardar = handleSubmit((datos) => {
    const conFechas = datos.tipo === 'aviso';
    onGuardar({
      tipo: datos.tipo,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      publicado: datos.publicado,
      // Vacías o en un informativo, las fechas se quitan (undefined también borra al editar).
      fechaInicio: conFechas && datos.fechaInicio ? datos.fechaInicio : undefined,
      fechaFin: conFechas && datos.fechaFin ? datos.fechaFin : undefined,
    });
  });

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <Controller
        control={control}
        name="tipo"
        render={({ field: { value, onChange } }) => (
          <View style={estilos.grupo}>
            <Text variant="labelLarge" style={estilos.etiquetaGrupo}>
              Tipo
            </Text>
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={TIPOS_EDITABLES.map((tipo) => ({
                value: tipo,
                label: TIPOS_CONTENIDO[tipo].nombre,
                icon: TIPOS_CONTENIDO[tipo].icono,
                disabled: guardando,
                accessibilityLabel: `Tipo ${TIPOS_CONTENIDO[tipo].nombre}`,
              }))}
            />
          </View>
        )}
      />

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
              {errors.descripcion?.message}
            </HelperText>
          </View>
        )}
      />

      {esAviso ? (
        <View style={estilos.grupo}>
          <Text variant="labelLarge" style={estilos.etiquetaGrupo}>
            Vigencia (opcional)
          </Text>
          <Text variant="bodySmall" style={estilos.ayuda}>
            El aviso solo se muestra entre estas fechas. Formato AAAA-MM-DD.
          </Text>
          {(['fechaInicio', 'fechaFin'] as const).map((campo) => (
            <Controller
              key={campo}
              control={control}
              name={campo}
              render={({ field: { ref, value, onChange, onBlur } }) => (
                <View>
                  <TextInput
                    ref={ref}
                    mode="outlined"
                    label={campo === 'fechaInicio' ? 'Inicio' : 'Fin'}
                    placeholder="2026-10-20"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors[campo] != null}
                    disabled={guardando}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    right={
                      <TextInput.Icon
                        icon="calendar-outline"
                        accessible={false}
                        importantForAccessibility="no"
                      />
                    }
                    accessibilityLabel={`${campo === 'fechaInicio' ? 'Inicio' : 'Fin'} de la vigencia, formato año, mes y día`}
                  />
                  <HelperText type="error" visible={errors[campo] != null}>
                    {errors[campo]?.message}
                  </HelperText>
                </View>
              )}
            />
          ))}
        </View>
      ) : null}

      <Controller
        control={control}
        name="publicado"
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta="Publicado"
            ayuda="Visible para la comunidad en Inicio."
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
        disabled={guardando || (contenido != null && !isDirty)}
        contentStyle={estilos.contenidoBoton}
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={contenido ? 'Guardar cambios del contenido' : 'Crear contenido'}
      >
        {contenido ? 'Guardar cambios' : 'Crear'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  grupo: { gap: espacio.s, marginBottom: espacio.s },
  etiquetaGrupo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
