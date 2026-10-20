/**
 * Formulario de bloqueo de un espacio (HU-20): por franja, día o rango, y el motivo.
 * Solo valida y entrega los datos: la pantalla revisa las reservas afectadas con
 * usePrevisualizarBloqueo() (CA1) y confirma con useConfirmarBloqueo() (CA2, CA3).
 * Cada cambio en un campo avisa con onCambio, para que la revisión anterior no se use.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';
import {
  esquemaBloqueo,
  MODOS_BLOQUEO,
  type DatosFormularioBloqueo,
  type ModoBloqueo,
} from '@/utils/bloqueos';
import { hoyISO } from '@/utils/fechas';

type Campo = 'fecha' | 'desde' | 'hasta' | 'horaInicio' | 'horaFin';

type DefinicionCampo = { nombre: Campo; etiqueta: string; ayuda: string; teclado: 'numbers-and-punctuation' };

const FECHA = (nombre: Campo, etiqueta: string): DefinicionCampo => ({
  nombre,
  etiqueta,
  ayuda: 'AAAA-MM-DD',
  teclado: 'numbers-and-punctuation',
});
const HORA = (nombre: Campo, etiqueta: string): DefinicionCampo => ({
  nombre,
  etiqueta,
  ayuda: 'HH:MM',
  teclado: 'numbers-and-punctuation',
});

/** Campos que se ven en cada modo. */
const CAMPOS_POR_MODO: Record<ModoBloqueo, DefinicionCampo[]> = {
  franja: [FECHA('fecha', 'Fecha'), HORA('horaInicio', 'Hora de inicio'), HORA('horaFin', 'Hora de fin')],
  dia: [FECHA('fecha', 'Fecha')],
  rango: [FECHA('desde', 'Desde'), FECHA('hasta', 'Hasta')],
};

const AYUDA_MODO: Record<ModoBloqueo, string> = {
  franja: 'Bloquea unas horas de un día.',
  dia: 'Bloquea el día completo.',
  rango: 'Bloquea varios días completos, ambos incluidos.',
};

type Props = {
  /** true mientras se revisan las reservas afectadas o se aplica el bloqueo. */
  ocupado: boolean;
  onRevisar: (datos: DatosFormularioBloqueo) => void;
  onCambio: () => void;
};

export function FormularioBloqueo({ ocupado, onRevisar, onCambio }: Props) {
  const hoy = hoyISO();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaBloqueo),
    defaultValues: {
      modo: 'franja' as ModoBloqueo,
      fecha: hoy,
      desde: hoy,
      hasta: hoy,
      horaInicio: '',
      horaFin: '',
      motivo: '',
    },
  });
  const modo = useWatch({ control, name: 'modo' });

  return (
    <View style={estilos.formulario}>
      <Controller
        control={control}
        name="modo"
        render={({ field: { value, onChange } }) => (
          <View style={estilos.grupo}>
            <Text variant="labelLarge" style={estilos.etiquetaGrupo}>
              Tipo de bloqueo
            </Text>
            <SegmentedButtons
              value={value}
              onValueChange={(valor) => {
                onChange(valor as ModoBloqueo);
                onCambio();
              }}
              buttons={MODOS_BLOQUEO.map((opcion) => ({
                value: opcion.valor,
                label: opcion.etiqueta,
                icon: opcion.icono,
                disabled: ocupado,
                accessibilityLabel: `Bloquear por ${opcion.etiqueta.toLowerCase()}`,
              }))}
            />
            <Text variant="bodySmall" style={estilos.ayuda}>
              {AYUDA_MODO[value]}
            </Text>
          </View>
        )}
      />

      {CAMPOS_POR_MODO[modo].map((campo) => (
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
                onChangeText={(texto) => {
                  onChange(texto);
                  onCambio();
                }}
                onBlur={onBlur}
                error={errors[campo.nombre] != null}
                disabled={ocupado}
                keyboardType={campo.teclado}
                autoCapitalize="none"
                accessibilityLabel={`${campo.etiqueta}, formato ${campo.ayuda}`}
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
        name="motivo"
        render={({ field: { ref, value, onChange, onBlur } }) => (
          <View>
            <TextInput
              ref={ref}
              mode="outlined"
              label="Motivo"
              placeholder="Por ejemplo: Consejo de facultad"
              value={value}
              onChangeText={(texto) => {
                onChange(texto);
                onCambio();
              }}
              onBlur={onBlur}
              error={errors.motivo != null}
              disabled={ocupado}
              multiline
              accessibilityLabel="Motivo del bloqueo"
            />
            <HelperText type="error" visible={errors.motivo != null}>
              {errors.motivo?.message ?? ''}
            </HelperText>
          </View>
        )}
      />

      <Button
        mode="contained"
        icon="calendar-search"
        onPress={handleSubmit(onRevisar)}
        loading={ocupado}
        disabled={ocupado}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Revisar las reservas afectadas por el bloqueo"
      >
        Revisar reservas afectadas
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  grupo: { gap: espacio.s, marginBottom: espacio.s },
  etiquetaGrupo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  contenidoBoton: { paddingVertical: espacio.xs },
});
