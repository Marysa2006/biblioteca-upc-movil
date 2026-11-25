/**
 * Formulario para crear o editar una guía de la biblioteca (#258).
 * Título, descripción y el formato: el PDF de la guía (#303), un enlace (Drive o una página) o el
 * contenido escrito aquí.
 * - PDF: «Elegir PDF» abre el selector del celular; se ve el nombre y el tamaño, con «Cambiar PDF».
 *   Lo que no es PDF, está vacío o pasa de 10 MB se explica bajo el campo al elegirlo (CA4).
 * - Enlace: tiene que ser https; si no, el error sale bajo el campo (CA3).
 * Solo valida y entrega los datos: la pantalla guarda con useEditarGuia() y muestra el error de
 * la API (mensajeError).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import type { DatosGuia } from '@/hooks/useGuias';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Guia } from '@/types';
import {
  BYTES_MAXIMOS_PDF,
  datosDeGuia,
  esquemaGuia,
  formatoDe,
  FORMATOS_GUIA,
  textoTamano,
  type FormatoGuia,
  type FormularioGuia as ValoresGuia,
} from '@/utils/guias';
import { elegirPdfGuia } from '@/utils/guiasOffline';

type Props = {
  /** Sin guía, el formulario crea una nueva. */
  guia?: Guia;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosGuia) => void;
};

/** El PDF primero: es como la biblioteca tiene sus guías (#303). */
const FORMATOS: FormatoGuia[] = ['pdf', 'enlace', 'escrita'];

const AYUDA_PDF = `Hasta ${textoTamano(BYTES_MAXIMOS_PDF)}. La comunidad lo guarda en el celular y lo lee sin conexión.`;

export function FormularioGuia({ guia, guardando, mensajeError, onGuardar }: Props) {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isDirty },
  } = useForm<ValoresGuia>({
    resolver: zodResolver(esquemaGuia),
    defaultValues: {
      formato: guia ? formatoDe(guia) : 'pdf',
      titulo: guia?.titulo ?? '',
      descripcion: guia?.descripcion ?? '',
      archivo: guia?.archivo ?? null,
      enlace: guia?.enlace ?? '',
      contenido: guia?.contenido ?? '',
      publicado: guia?.publicado ?? true,
    },
  });
  // useWatch y no watch(): watch no es compatible con el React Compiler del proyecto.
  const formato = useWatch({ control, name: 'formato' });
  /** Mientras el selector de archivos está abierto. */
  const [eligiendo, setEligiendo] = useState(false);

  const guardar = handleSubmit((valores) => onGuardar(datosDeGuia(esquemaGuia.parse(valores))));

  /** Abre el selector; si el PDF no sirve, lo dice bajo el campo en ese momento (CA4). */
  const elegirPdf = async (onChange: (valor: ValoresGuia['archivo']) => void) => {
    setEligiendo(true);
    try {
      const elegido = await elegirPdfGuia();
      if (!elegido) return;
      onChange(elegido);
      clearErrors('archivo');
      await trigger('archivo');
    } catch {
      setError('archivo', { message: 'No pudimos abrir el PDF. Inténtalo otra vez.' });
    } finally {
      setEligiendo(false);
    }
  };

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
            {/* Nombres cortos: tres largos no caben en el ancho del celular. */}
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={FORMATOS.map((opcion) => ({
                value: opcion,
                label: FORMATOS_GUIA[opcion].corto,
                icon: FORMATOS_GUIA[opcion].icono,
                disabled: guardando,
                accessibilityLabel: `Formato ${FORMATOS_GUIA[opcion].nombre}`,
              }))}
            />
          </View>
        )}
      />

      {formato === 'pdf' ? (
        <Controller
          control={control}
          name="archivo"
          render={({ field: { value, onChange } }) => (
            <View style={estilos.grupo}>
              {value ? (
                <View
                  style={estilos.archivo}
                  accessible
                  accessibilityLabel={`PDF elegido: ${value.nombre}, ${textoTamano(value.bytes)}`}
                >
                  <Icon source="file-pdf-box" size={32} color={colores.primario} />
                  <View style={estilos.textosArchivo}>
                    <Text variant="bodyLarge" style={estilos.nombreArchivo} numberOfLines={2}>
                      {value.nombre}
                    </Text>
                    <Text variant="bodySmall" style={estilos.secundario}>
                      {textoTamano(value.bytes)}
                    </Text>
                  </View>
                </View>
              ) : null}
              <Button
                mode="outlined"
                icon={value ? 'file-replace-outline' : 'file-upload-outline'}
                onPress={() => elegirPdf(onChange)}
                loading={eligiendo}
                disabled={guardando || eligiendo}
                contentStyle={estilos.contenidoBoton}
                style={estilos.botonIzquierda}
                accessibilityRole="button"
                accessibilityLabel={
                  value ? 'Cambiar el PDF de la guía' : 'Elegir el PDF de la guía'
                }
              >
                {value ? 'Cambiar PDF' : 'Elegir PDF'}
              </Button>
              <View accessibilityLiveRegion="polite">
                <HelperText type={errors.archivo ? 'error' : 'info'} visible>
                  {errors.archivo?.message ?? AYUDA_PDF}
                </HelperText>
              </View>
            </View>
          )}
        />
      ) : null}

      {formato === 'enlace' ? (
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
                  'El Drive o la página de la guía. La comunidad lo abre en el navegador, con internet.'}
              </HelperText>
            </View>
          )}
        />
      ) : null}

      {formato === 'escrita' ? (
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
      ) : null}

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
        disabled={guardando || eligiendo || (guia != null && !isDirty)}
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
  archivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textosArchivo: { flex: 1, gap: espacio.xs },
  nombreArchivo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  botonIzquierda: { alignSelf: 'flex-start' },
  contenido: { minHeight: 160 },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
