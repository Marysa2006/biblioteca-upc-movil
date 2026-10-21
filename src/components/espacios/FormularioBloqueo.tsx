/**
 * Formulario de bloqueo de un espacio (HU-20): por franja, día o rango, y el motivo.
 * Solo valida y entrega los datos: la pantalla revisa las reservas afectadas con
 * usePrevisualizarBloqueo() (CA1) y confirma con useConfirmarBloqueo() (CA2, CA3).
 *
 * Las fechas se eligen en un calendario (SelectorFecha) y las horas en un reloj de horas en
 * punto (SelectorHora): solo se pueden tocar los días hábiles y las horas del horario de
 * atención (HU-28) que no chocan con otro bloqueo del espacio. Al revisar, crearEsquemaBloqueo
 * vuelve a validar todo. Cada cambio avisa con onCambio, para que la revisión anterior no se use.
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
  fechaLimite,
  horasDeFin,
  horasDeInicio,
  MODOS_BLOQUEO,
  motivoDiaNoElegible,
  type ContextoBloqueo,
  type DatosFormularioBloqueo,
  type ModoBloqueo,
} from '@/utils/bloqueos';
import { sumarDias } from '@/utils/calendario';
import { esFechaValida, hoyISO } from '@/utils/fechas';

import { SelectorFecha } from './SelectorFecha';
import { SelectorHora } from './SelectorHora';

const AYUDA_MODO: Record<ModoBloqueo, string> = {
  franja: 'Bloquea unas horas de un día hábil, dentro del horario de atención.',
  dia: 'Bloquea un día hábil completo.',
  rango: 'Bloquea varios días completos, ambos incluidos (máximo 31).',
};

function horaActual(): string {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

/** Primer día que se puede elegir en franja desde hoy, para empezar con una fecha que sirva. */
function primerDiaElegible(contexto: ContextoBloqueo): string {
  let dia = contexto.hoy;
  for (let i = 0; i < 60 && motivoDiaNoElegible(dia, 'franja', contexto); i++) {
    dia = sumarDias(dia, 1);
  }
  return dia;
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
    const contexto: ContextoBloqueo = { parametros, bloqueos, hoy: hoyISO(), ahora: horaActual() };
    return {
      contexto,
      esquema: crearEsquemaBloqueo(contexto),
      fecha: primerDiaElegible(contexto),
    };
  });
  const { contexto } = inicio;
  const limite = fechaLimite(contexto.hoy);

  const {
    control,
    handleSubmit,
    setValue,
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
  const [modo, fecha, desde, hasta, horaInicio, horaFin] = useWatch({
    control,
    name: ['modo', 'fecha', 'desde', 'hasta', 'horaInicio', 'horaFin'],
  });

  const cambiarModo = (valor: ModoBloqueo) => {
    setValue('modo', valor);
    onCambio();
  };

  /** Cambia una fecha u hora y descarta lo que dependía de ella. */
  const cambiar = (campo: 'fecha' | 'desde' | 'hasta' | 'horaInicio' | 'horaFin', valor: string) => {
    // Si el campo mostraba un error, se vuelve a validar para quitarlo.
    setValue(campo, valor, { shouldValidate: errors[campo] != null });
    if (campo === 'fecha') {
      setValue('horaInicio', '');
      setValue('horaFin', '');
    }
    if (campo === 'horaInicio') setValue('horaFin', '');
    if (campo === 'desde') setValue('hasta', '');
    onCambio();
  };

  const opcionesInicio = horasDeInicio(fecha, contexto);
  const opcionesFin = horasDeFin(fecha, horaInicio, contexto);
  const diaSiguiente = esFechaValida(desde) ? sumarDias(desde, 1) : contexto.hoy;

  return (
    <View style={estilos.formulario}>
      <View style={estilos.grupo}>
        <Text variant="labelLarge" style={estilos.etiquetaGrupo}>
          Tipo de bloqueo
        </Text>
        <SegmentedButtons
          value={modo}
          onValueChange={(valor) => cambiarModo(valor as ModoBloqueo)}
          buttons={MODOS_BLOQUEO.map((opcion) => ({
            value: opcion.valor,
            label: opcion.etiqueta,
            icon: opcion.icono,
            disabled: ocupado,
            accessibilityLabel: `Bloquear por ${opcion.etiqueta.toLowerCase()}`,
          }))}
        />
        <Text variant="bodySmall" style={estilos.ayuda}>
          {AYUDA_MODO[modo]}
        </Text>
      </View>

      {modo === 'rango' ? (
        <>
          <SelectorFecha
            etiqueta="Desde"
            valor={desde}
            onCambiar={(valor) => cambiar('desde', valor)}
            motivoNoElegible={(dia) => motivoDiaNoElegible(dia, 'rango', contexto)}
            mesMinimo={contexto.hoy}
            mesMaximo={limite}
            mensajeError={errors.desde?.message}
            descripcion={descripcionFecha(desde, parametros)}
            deshabilitado={ocupado}
          />
          <SelectorFecha
            etiqueta="Hasta"
            valor={hasta}
            onCambiar={(valor) => cambiar('hasta', valor)}
            motivoNoElegible={(dia) => motivoDiaNoElegible(dia, 'rango', contexto, diaSiguiente)}
            mesMinimo={diaSiguiente}
            mesMaximo={limite}
            mensajeError={errors.hasta?.message}
            descripcion={descripcionFecha(hasta, parametros)}
            deshabilitado={ocupado}
          />
        </>
      ) : (
        <SelectorFecha
          etiqueta="Fecha"
          valor={fecha}
          onCambiar={(valor) => cambiar('fecha', valor)}
          motivoNoElegible={(dia) => motivoDiaNoElegible(dia, modo, contexto)}
          mesMinimo={contexto.hoy}
          mesMaximo={limite}
          mensajeError={errors.fecha?.message}
          descripcion={descripcionFecha(fecha, parametros)}
          deshabilitado={ocupado}
        />
      )}

      {modo === 'franja' ? (
        <>
          <SelectorHora
            etiqueta="Hora de inicio"
            opciones={opcionesInicio}
            valor={horaInicio}
            onCambiar={(valor) => cambiar('horaInicio', valor)}
            sinOpciones="Elige primero un día hábil."
            mensajeError={errors.horaInicio?.message}
            deshabilitado={ocupado}
          />
          <SelectorHora
            etiqueta="Hora de fin"
            opciones={opcionesFin}
            valor={horaFin}
            onCambiar={(valor) => cambiar('horaFin', valor)}
            sinOpciones="Elige primero la hora de inicio."
            mensajeError={errors.horaFin?.message}
            deshabilitado={ocupado}
          />
        </>
      ) : null}

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
