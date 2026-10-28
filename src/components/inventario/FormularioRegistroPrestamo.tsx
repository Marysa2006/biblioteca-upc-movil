/**
 * Formulario de entrega o de devolución de una tablet (HU-23).
 * - Entrega (CA1): estado del equipo y accesorios entregados; la fecha y la hora las pone el
 *   sistema al guardar. Una tablet dañada no se entrega.
 * - Devolución (CA2-CA4): estado, accesorios recibidos y novedades. Si volvió dañada o falta un
 *   accesorio, la novedad es obligatoria (CA3). Si llega tarde, avisa el retraso que quedará
 *   registrado (CA4).
 * Solo valida y entrega los datos: la pantalla guarda con useRegistrarEntrega() o
 * useRegistrarDevolucion().
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text, TextInput } from 'react-native-paper';

import { ChipsOpcion } from '@/components/asesorias/ChipsOpcion';
import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { CondicionTablet, Prestamo, Tablet } from '@/types';
import {
  accesoriosFaltantes,
  AYUDA_CONDICION,
  crearEsquemaDevolucion,
  duracionLegible,
  esquemaEntrega,
  fechaHoraLegible,
  NOMBRE_CONDICION,
} from '@/utils/prestamos';
import { ahoraFechaHora, minutosDeRetraso } from '@/utils/tablets';

import { CasillasAccesorios } from './CasillasAccesorios';

export type Modo = 'entrega' | 'devolucion';

export type DatosRegistro = {
  condicion: CondicionTablet;
  accesorios: string[];
  novedades?: string;
};

const CONDICIONES: CondicionTablet[] = ['bueno', 'regular', 'danado'];

type Props = {
  modo: Modo;
  prestamo: Prestamo;
  tablet: Tablet;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosRegistro) => void;
};

export function FormularioRegistroPrestamo({ modo, prestamo, tablet, guardando, mensajeError, onGuardar }: Props) {
  const esDevolucion = modo === 'devolucion';
  // En la entrega se marcan los accesorios de la tablet; en la devolución, los que se entregaron.
  const opcionesAccesorios = esDevolucion ? (prestamo.entrega?.accesorios ?? []) : tablet.accesorios;
  const [esquema] = useState(() => (esDevolucion ? crearEsquemaDevolucion(opcionesAccesorios) : esquemaEntrega));
  // El retraso se calcula una vez al abrir; la API lo recalcula al guardar.
  const [retraso] = useState(() => (esDevolucion ? minutosDeRetraso(prestamo) : 0));

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<{ condicion: CondicionTablet | ''; accesorios: string[]; novedades: string }>({
    // El esquema de entrega no tiene novedades: se ignoran al guardar.
    resolver: zodResolver(esquema as typeof esquemaEntrega) as never,
    defaultValues: {
      condicion: esDevolucion ? '' : 'bueno',
      accesorios: [...opcionesAccesorios],
      novedades: '',
    },
  });
  const [condicion, accesorios] = useWatch({ control, name: ['condicion', 'accesorios'] });
  const faltan = esDevolucion ? accesoriosFaltantes(opcionesAccesorios, accesorios) : [];

  const guardar = handleSubmit((valores) =>
    onGuardar({
      condicion: valores.condicion as CondicionTablet,
      accesorios: valores.accesorios,
      ...(esDevolucion && valores.novedades.trim() ? { novedades: valores.novedades.trim() } : {}),
    }),
  );

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <View style={estilos.resumen}>
        <Text variant="titleSmall" style={estilos.titulo}>
          {`${tablet.modelo} · ${tablet.codigo}`}
        </Text>
        <Text variant="bodyMedium" style={estilos.texto}>
          {esDevolucion ? `La devuelve ${prestamo.solicitante}` : `Para ${prestamo.solicitante}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {esDevolucion && prestamo.entrega
            ? `Salió el ${fechaHoraLegible(prestamo.entrega.fechaHora)} · hora límite ${prestamo.horaLimite}`
            : `Franja ${prestamo.horaInicio} a ${prestamo.horaLimite}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Se registra con la fecha y hora actual: ${fechaHoraLegible(ahoraFechaHora())}.`}
        </Text>
      </View>

      {retraso > 0 ? (
        <View style={estilos.retraso} accessibilityLiveRegion="polite">
          <Icon source="clock-alert-outline" size={20} color={coloresEstado.rechazada.texto} />
          <Text variant="bodyMedium" style={estilos.textoRetraso}>
            {`Llega con ${duracionLegible(retraso)} de retraso (hora límite ${prestamo.horaLimite}). Quedará constancia en el préstamo.`}
          </Text>
        </View>
      ) : null}

      <ChipsOpcion
        titulo="Estado del equipo"
        opciones={CONDICIONES.map((valor) => ({
          valor,
          etiqueta: NOMBRE_CONDICION[valor],
          motivo: !esDevolucion && valor === 'danado' ? 'una tablet dañada no se entrega' : undefined,
        }))}
        elegidos={condicion ? [condicion] : []}
        onCambiar={([valor]) => valor && setValue('condicion', valor, { shouldValidate: isSubmitted })}
        ayuda={condicion ? AYUDA_CONDICION[condicion] : 'Revisa la pantalla, el cuerpo y que encienda.'}
        mensajeError={errors.condicion?.message}
        deshabilitado={guardando}
      />

      <CasillasAccesorios
        titulo={esDevolucion ? 'Accesorios recibidos' : 'Accesorios entregados'}
        opciones={opcionesAccesorios}
        marcados={accesorios}
        onCambiar={(lista) => setValue('accesorios', lista, { shouldValidate: isSubmitted })}
        aviso={
          faltan.length > 0
            ? `Falta: ${faltan.join(', ')}. Descríbelo en las novedades.`
            : esDevolucion
              ? undefined
              : 'Desmarca lo que no se entregue: al recibirla se revisa lo mismo.'
        }
        deshabilitado={guardando}
      />

      {esDevolucion ? (
        <Controller
          control={control}
          name="novedades"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label={condicion === 'danado' || faltan.length > 0 ? 'Novedades (obligatorio)' : 'Novedades (opcional)'}
                placeholder="Por ejemplo: la pantalla tiene un rayón en la esquina"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.novedades != null}
                disabled={guardando}
                multiline
                maxLength={300}
                accessibilityLabel="Novedades de la devolución: daños o faltantes"
              />
              <HelperText type="error" visible={errors.novedades != null}>
                {errors.novedades?.message ?? ''}
              </HelperText>
            </View>
          )}
        />
      ) : null}

      {esDevolucion && condicion === 'danado' ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          La tablet quedará en mantenimiento y no se prestará hasta revisarla.
        </Text>
      ) : null}

      <Button
        mode="contained"
        icon={esDevolucion ? 'clipboard-check-outline' : 'tablet'}
        onPress={guardar}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={
          esDevolucion
            ? `Registrar la devolución y cerrar el préstamo de ${prestamo.solicitante}`
            : `Registrar la entrega de ${tablet.codigo} a ${prestamo.solicitante}`
        }
      >
        {esDevolucion ? 'Registrar devolución' : 'Registrar entrega'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.s },
  resumen: { gap: espacio.xs, padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.superficie },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
  retraso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  textoRetraso: { flex: 1, color: coloresEstado.rechazada.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
});
