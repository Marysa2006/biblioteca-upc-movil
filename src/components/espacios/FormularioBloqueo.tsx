/**
 * Formulario de bloqueo de un espacio (HU-20): por franja, día o rango, y el motivo.
 * Solo valida y entrega los datos: la pantalla revisa las reservas afectadas con
 * usePrevisualizarBloqueo() (CA1) y confirma con useConfirmarBloqueo() (CA2, CA3).
 *
 * Valida con los parámetros de la biblioteca (HU-28) y los bloqueos que ya tiene el espacio
 * (crearEsquemaBloqueo). Las fechas y horas se formatean mientras se escriben, y debajo de
 * cada fecha se ve el día y su horario de atención.
 * Cada cambio en un campo avisa con onCambio, para que la revisión anterior no se use.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';
import type { Bloqueo, Parametros } from '@/types';
import {
  crearEsquemaBloqueo,
  descripcionFecha,
  formatearFecha,
  formatearHora,
  MODOS_BLOQUEO,
  type DatosFormularioBloqueo,
  type ModoBloqueo,
} from '@/utils/bloqueos';
import { sumarDias } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { problemaFecha } from '@/utils/reservas';

type Campo = 'fecha' | 'desde' | 'hasta' | 'horaInicio' | 'horaFin';

type DefinicionCampo = { nombre: Campo; etiqueta: string; tipo: 'fecha' | 'hora' };

/** Campos que se ven en cada modo. */
const CAMPOS_POR_MODO: Record<ModoBloqueo, DefinicionCampo[]> = {
  franja: [
    { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha' },
    { nombre: 'horaInicio', etiqueta: 'Hora de inicio', tipo: 'hora' },
    { nombre: 'horaFin', etiqueta: 'Hora de fin', tipo: 'hora' },
  ],
  dia: [{ nombre: 'fecha', etiqueta: 'Fecha', tipo: 'fecha' }],
  rango: [
    { nombre: 'desde', etiqueta: 'Desde', tipo: 'fecha' },
    { nombre: 'hasta', etiqueta: 'Hasta', tipo: 'fecha' },
  ],
};

const FORMATO = {
  fecha: { ayuda: 'AAAA-MM-DD', formatear: formatearFecha, largo: 10 },
  hora: { ayuda: 'HH:MM, en punto', formatear: formatearHora, largo: 5 },
} as const;

const AYUDA_MODO: Record<ModoBloqueo, string> = {
  franja: 'Bloquea unas horas de un día hábil, dentro del horario de atención.',
  dia: 'Bloquea un día hábil completo.',
  rango: 'Bloquea varios días completos, ambos incluidos (máximo 31).',
};

/** Primer día hábil desde mañana, para empezar con una fecha que sirva. */
function primerDiaHabil(parametros: Parametros, hoy: string): string {
  let dia = sumarDias(hoy, 1);
  for (let i = 0; i < 30 && problemaFecha(dia, parametros, hoy); i++) {
    dia = sumarDias(dia, 1);
  }
  return dia;
}

function horaActual(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

type Props = {
  parametros: Parametros;
  /** Bloqueos que ya tiene el espacio: el nuevo no puede cruzarse con ellos. */
  bloqueos: Bloqueo[];
  /** true mientras se revisan las reservas afectadas o se aplica el bloqueo. */
  ocupado: boolean;
  onRevisar: (datos: DatosFormularioBloqueo) => void;
  onCambio: () => void;
};

export function FormularioBloqueo({ parametros, bloqueos, ocupado, onRevisar, onCambio }: Props) {
  // Se arma una vez al montar: la pantalla monta un formulario nuevo después de cada bloqueo.
  const [inicio] = useState(() => {
    const hoy = hoyISO();
    return {
      esquema: crearEsquemaBloqueo({ parametros, bloqueos, hoy, ahora: horaActual() }),
      fecha: primerDiaHabil(parametros, hoy),
    };
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inicio.esquema),
    defaultValues: {
      modo: 'franja' as ModoBloqueo,
      fecha: inicio.fecha,
      desde: inicio.fecha,
      hasta: '',
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

      {CAMPOS_POR_MODO[modo].map((campo) => {
        const formato = FORMATO[campo.tipo];
        return (
          <Controller
            key={campo.nombre}
            control={control}
            name={campo.nombre}
            render={({ field: { ref, value, onChange, onBlur } }) => {
              const mensajeError = errors[campo.nombre]?.message;
              const descripcion =
                campo.tipo === 'fecha' ? descripcionFecha(value, parametros) : '';
              return (
                <View>
                  <TextInput
                    ref={ref}
                    mode="outlined"
                    label={campo.etiqueta}
                    placeholder={formato.ayuda}
                    value={value}
                    onChangeText={(texto) => {
                      onChange(formato.formatear(texto));
                      onCambio();
                    }}
                    onBlur={onBlur}
                    error={mensajeError != null}
                    disabled={ocupado}
                    keyboardType="number-pad"
                    maxLength={formato.largo}
                    accessibilityLabel={`${campo.etiqueta}, formato ${formato.ayuda}`}
                  />
                  {mensajeError ? (
                    <HelperText type="error" visible>
                      {mensajeError}
                    </HelperText>
                  ) : (
                    <HelperText type="info" visible={descripcion !== ''}>
                      {descripcion}
                    </HelperText>
                  )}
                </View>
              );
            }}
          />
        );
      })}

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
              maxLength={200}
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
