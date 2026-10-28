/**
 * Formulario de jornada de asesoría (HU-13): tema, facilitador, días, horario, duración,
 * cupos, modalidad, vigencia y fechas excluidas. Sin escribir fechas ni horas: se eligen en el
 * calendario y el reloj de HU-20 (SelectorFecha y SelectorHora) y en chips.
 *
 * - CA1: la vista previa dice cuántas franjas se generarán, con la misma función que la API.
 * - CA2: avisa antes de guardar si se traslapa con otra jornada del facilitador.
 * - CA3: las fechas excluidas se eligen en el calendario y no generan franjas.
 * Solo valida y entrega los datos: la pantalla guarda con useGuardarJornada().
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Icon, SegmentedButtons, Text } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { SelectorHora } from '@/components/espacios/SelectorHora';
import { AvisoError, FilaInterruptor } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Jornada, ModalidadAsesoria, Parametros, TemaAsesoria, Usuario } from '@/types';
import type { OpcionHora } from '@/utils/bloqueos';
import { fechaCompleta, sumarDias } from '@/utils/calendario';
import { esHoraValida, fechaLegible, hoyISO } from '@/utils/fechas';
import { aHora, aMinutos } from '@/utils/franjas';
import {
  atiendeDia,
  crearEsquemaJornada,
  CUPOS,
  DIAS_MAXIMOS_VIGENCIA,
  DIAS_SEMANA,
  DURACIONES,
  franjasPrevias,
  motivoNoExcluible,
  NOMBRE_MODALIDAD,
  ventanaComun,
  type DatosFormularioJornada,
} from '@/utils/jornadas';

import { ChipsOpcion } from './ChipsOpcion';

export type DatosJornadaGuardar = Omit<Jornada, 'id'> & { id?: string };

type Campo = keyof DatosFormularioJornada;

/** Horas en punto desde `desde` hasta `hasta`, ambas incluidas si son en punto. */
function horasEnPunto(desde: string, hasta: string): string[] {
  const primera = Math.ceil(aMinutos(desde) / 60);
  const ultima = Math.floor(aMinutos(hasta) / 60);
  return Array.from({ length: Math.max(0, ultima - primera + 1) }, (_, i) => aHora((primera + i) * 60));
}

type Props = {
  parametros: Parametros;
  temas: TemaAsesoria[];
  jornadas: Jornada[];
  facilitadores: Usuario[];
  /** Sin jornada, el formulario crea una nueva. */
  original?: Jornada;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosJornadaGuardar) => void;
};

export function FormularioJornada({
  parametros,
  temas,
  jornadas,
  facilitadores,
  original,
  guardando,
  mensajeError,
  onGuardar,
}: Props) {
  // Se arma una vez al montar, con las jornadas que había al abrir el formulario.
  const [inicio] = useState(() => {
    const hoy = hoyISO();
    return { hoy, esquema: crearEsquemaJornada({ parametros, jornadas, temas, hoy, original }) };
  });
  const { hoy } = inicio;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted, isDirty },
  } = useForm({
    resolver: zodResolver(inicio.esquema),
    defaultValues: {
      temaId: original?.temaId ?? '',
      facilitadorId: original?.facilitadorId ?? '',
      dias: original?.dias ?? [],
      horaInicio: original?.horaInicio ?? '',
      horaFin: original?.horaFin ?? '',
      duracionMinutos: original?.duracionMinutos ?? 30,
      cupos: original?.cupos ?? 2,
      modalidad: original?.modalidad ?? ('presencial' as ModalidadAsesoria),
      vigenciaDesde: original?.vigenciaDesde ?? hoy,
      vigenciaHasta: original?.vigenciaHasta ?? '',
      excepciones: original?.excepciones ?? [],
      activa: original?.activa ?? true,
    },
  });
  const datos = useWatch({ control }) as DatosFormularioJornada;

  /** Cambia un campo; después del primer intento de guardar, valida en vivo. */
  const cambiar = <K extends Campo>(campo: K, valor: DatosFormularioJornada[K]) =>
    setValue(campo, valor as never, { shouldValidate: isSubmitted, shouldDirty: true });

  // ── Opciones de cada campo ──────────────────────────────────────────────────────────
  const opcionesTema = temas
    .filter((tema) => tema.activo || tema.id === original?.temaId)
    .map((tema) => ({ valor: tema.id, etiqueta: tema.nombre }));

  const opcionesFacilitador = facilitadores.map((usuario) => ({
    valor: usuario.id,
    etiqueta: usuario.nombre,
  }));

  const opcionesDias = DIAS_SEMANA.map(({ dia, corto, nombre }) => ({
    valor: dia,
    etiqueta: corto,
    motivo: atiendeDia(dia, parametros) ? undefined : `la biblioteca no atiende el ${nombre.toLowerCase()}`,
  }));

  const ventana = ventanaComun(datos.dias, parametros);
  // Inicio: hasta una hora antes del cierre. Fin: desde una hora después del inicio hasta el cierre.
  const opcionesInicio: OpcionHora[] = ventana
    ? horasEnPunto(ventana.abre, aHora(aMinutos(ventana.cierra) - 60)).map((hora) => ({ hora }))
    : [];
  const opcionesFin: OpcionHora[] =
    ventana && esHoraValida(datos.horaInicio)
      ? horasEnPunto(aHora(aMinutos(datos.horaInicio) + 60), ventana.cierra).map((hora) => ({ hora }))
      : [];

  const largoHorario =
    esHoraValida(datos.horaInicio) && esHoraValida(datos.horaFin)
      ? aMinutos(datos.horaFin) - aMinutos(datos.horaInicio)
      : null;
  const opcionesDuracion = DURACIONES.map((minutos) => ({
    valor: minutos,
    etiqueta: `${minutos} min`,
    motivo: largoHorario != null && minutos > largoHorario ? 'no cabe en el horario' : undefined,
  }));

  const opcionesCupos = CUPOS.map((cupos) => ({ valor: cupos, etiqueta: String(cupos) }));

  // ── Cambios con dependencias ────────────────────────────────────────────────────────
  const cambiarDias = (dias: number[]) => {
    cambiar('dias', dias);
    const nueva = ventanaComun(dias, parametros);
    // Si el horario ya no cabe en los días elegidos, se vuelve a elegir.
    if (!nueva || datos.horaInicio < nueva.abre || datos.horaFin > nueva.cierra) {
      cambiar('horaInicio', '');
      cambiar('horaFin', '');
    }
    // Las fechas excluidas que ya no son de la jornada sobran.
    cambiar(
      'excepciones',
      datos.excepciones.filter((f) => dias.includes(new Date(`${f}T00:00:00`).getDay())),
    );
  };

  const cambiarInicio = (hora: string) => {
    cambiar('horaInicio', hora);
    if (datos.horaFin && datos.horaFin <= hora) cambiar('horaFin', '');
  };

  const cambiarVigencia = (campo: 'vigenciaDesde' | 'vigenciaHasta', fecha: string) => {
    cambiar(campo, fecha);
    const desde = campo === 'vigenciaDesde' ? fecha : datos.vigenciaDesde;
    const hasta = campo === 'vigenciaHasta' ? fecha : datos.vigenciaHasta;
    if (campo === 'vigenciaDesde' && hasta && hasta < fecha) cambiar('vigenciaHasta', '');
    cambiar(
      'excepciones',
      datos.excepciones.filter((f) => f >= desde && (!hasta || f <= hasta)),
    );
  };

  const limiteHasta = datos.vigenciaDesde ? sumarDias(datos.vigenciaDesde, DIAS_MAXIMOS_VIGENCIA) : hoy;
  const previas = franjasPrevias(datos, parametros);
  const diasConFranjas = new Set(previas.map((franja) => franja.fecha)).size;
  const puedeExcluir = datos.dias.length > 0 && datos.vigenciaDesde !== '' && datos.vigenciaHasta !== '';

  const guardar = handleSubmit((valores) =>
    onGuardar({ ...valores, ...(original ? { id: original.id } : {}) }),
  );

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <ChipsOpcion
        titulo="Tema"
        opciones={opcionesTema}
        elegidos={datos.temaId ? [datos.temaId] : []}
        onCambiar={([tema]) => cambiar('temaId', tema ?? '')}
        ayuda={opcionesTema.length === 0 ? 'No hay temas activos: crea uno en la pestaña Temas.' : undefined}
        mensajeError={errors.temaId?.message}
        deshabilitado={guardando}
      />

      <ChipsOpcion
        titulo="Facilitador"
        opciones={opcionesFacilitador}
        elegidos={datos.facilitadorId ? [datos.facilitadorId] : []}
        onCambiar={([id]) => cambiar('facilitadorId', id ?? '')}
        ayuda={
          opcionesFacilitador.length === 0
            ? 'Nadie tiene el rol de facilitador: asígnalo en Personal.'
            : undefined
        }
        mensajeError={errors.facilitadorId?.message}
        deshabilitado={guardando}
      />

      <ChipsOpcion
        titulo="Días de atención"
        opciones={opcionesDias}
        elegidos={datos.dias}
        onCambiar={cambiarDias}
        multiple
        ayuda="Solo los días que la biblioteca atiende."
        mensajeError={errors.dias?.message}
        deshabilitado={guardando}
      />

      <SelectorHora
        etiqueta="Hora de inicio"
        opciones={opcionesInicio}
        valor={datos.horaInicio}
        onCambiar={cambiarInicio}
        sinOpciones="Elige primero los días."
        mensajeError={errors.horaInicio?.message}
        deshabilitado={guardando}
      />
      <SelectorHora
        etiqueta="Hora de fin"
        opciones={opcionesFin}
        valor={datos.horaFin}
        onCambiar={(hora) => cambiar('horaFin', hora)}
        sinOpciones="Elige primero la hora de inicio."
        mensajeError={errors.horaFin?.message}
        deshabilitado={guardando}
      />

      <ChipsOpcion
        titulo="Duración de cada cita"
        opciones={opcionesDuracion}
        elegidos={[datos.duracionMinutos]}
        onCambiar={([minutos]) => minutos && cambiar('duracionMinutos', minutos)}
        mensajeError={errors.duracionMinutos?.message}
        deshabilitado={guardando}
      />

      <ChipsOpcion
        titulo="Cupos por franja"
        opciones={opcionesCupos}
        elegidos={[datos.cupos]}
        onCambiar={([cupos]) => cupos && cambiar('cupos', cupos)}
        ayuda="Cuántas personas pueden agendar la misma franja."
        mensajeError={errors.cupos?.message}
        deshabilitado={guardando}
      />

      <View style={estilos.grupo}>
        <Text variant="labelLarge" style={estilos.titulo}>
          Modalidad
        </Text>
        <SegmentedButtons
          value={datos.modalidad}
          onValueChange={(valor) => cambiar('modalidad', valor as ModalidadAsesoria)}
          buttons={(['presencial', 'virtual'] as const).map((modalidad) => ({
            value: modalidad,
            label: NOMBRE_MODALIDAD[modalidad],
            icon: modalidad === 'presencial' ? 'account-group-outline' : 'laptop',
            disabled: guardando,
            accessibilityLabel: `Modalidad ${NOMBRE_MODALIDAD[modalidad].toLowerCase()}`,
          }))}
        />
      </View>

      <SelectorFecha
        etiqueta="Vigente desde"
        valor={datos.vigenciaDesde}
        onCambiar={(fecha) => cambiarVigencia('vigenciaDesde', fecha)}
        motivoNoElegible={(fecha) =>
          fecha < hoy && fecha !== original?.vigenciaDesde ? 'ya pasó' : null
        }
        mesMinimo={original && original.vigenciaDesde < hoy ? original.vigenciaDesde : hoy}
        mesMaximo={sumarDias(hoy, DIAS_MAXIMOS_VIGENCIA)}
        mensajeError={errors.vigenciaDesde?.message}
        deshabilitado={guardando}
      />
      <SelectorFecha
        etiqueta="Vigente hasta"
        valor={datos.vigenciaHasta}
        onCambiar={(fecha) => cambiarVigencia('vigenciaHasta', fecha)}
        motivoNoElegible={(fecha) => {
          if (fecha < hoy) return 'ya pasó';
          if (datos.vigenciaDesde && fecha < datos.vigenciaDesde) return 'antes del inicio de la vigencia';
          if (fecha > limiteHasta) return 'más de un año de vigencia';
          return null;
        }}
        mesMinimo={datos.vigenciaDesde && datos.vigenciaDesde > hoy ? datos.vigenciaDesde : hoy}
        mesMaximo={limiteHasta}
        mensajeError={errors.vigenciaHasta?.message}
        deshabilitado={guardando}
      />

      <View style={estilos.grupo}>
        <Text variant="labelLarge" style={estilos.titulo}>
          Fechas excluidas
        </Text>
        <Text variant="bodySmall" style={estilos.ayuda}>
          Días de la jornada sin atención (ausencias o eventos). No generan franjas. Los
          festivos de los parámetros ya se excluyen solos.
        </Text>
        {datos.excepciones.length > 0 ? (
          <View style={estilos.chips}>
            {[...datos.excepciones].sort().map((fecha) => (
              <Chip
                key={fecha}
                icon="calendar-remove-outline"
                onClose={() => cambiar('excepciones', datos.excepciones.filter((f) => f !== fecha))}
                closeIconAccessibilityLabel={`Quitar ${fechaCompleta(fecha)} de las fechas excluidas`}
                disabled={guardando}
                style={estilos.chipExcluida}
                accessibilityLabel={`Fecha excluida: ${fechaCompleta(fecha)}`}
              >
                {fechaLegible(fecha)}
              </Chip>
            ))}
          </View>
        ) : null}
        {puedeExcluir ? (
          <SelectorFecha
            etiqueta="Agregar fecha excluida"
            valor=""
            onCambiar={(fecha) => cambiar('excepciones', [...datos.excepciones, fecha])}
            motivoNoElegible={(fecha) => motivoNoExcluible(fecha, datos, parametros)}
            mesMinimo={datos.vigenciaDesde}
            mesMaximo={datos.vigenciaHasta}
            deshabilitado={guardando}
          />
        ) : (
          <Text variant="bodySmall" style={estilos.ayuda}>
            Elige los días y la vigencia para poder excluir fechas.
          </Text>
        )}
        <HelperText type="error" visible={errors.excepciones != null}>
          {errors.excepciones?.message ?? ''}
        </HelperText>
      </View>

      <FilaInterruptor
        etiqueta="Activa"
        ayuda="Una jornada inactiva no ofrece franjas para agendar."
        valor={datos.activa}
        onCambiar={(valor) => cambiar('activa', valor)}
        deshabilitado={guardando}
      />

      <View style={estilos.previa} accessibilityLiveRegion="polite">
        <View style={estilos.fila}>
          <Icon source="calendar-clock-outline" size={24} color={colores.primarioOscuro} />
          <Text variant="titleSmall" style={estilos.tituloPrevia}>
            Vista previa
          </Text>
        </View>
        <Text variant="bodyMedium" style={estilos.textoPrevia}>
          {previas.length > 0
            ? `Se generarán ${previas.length} ${previas.length === 1 ? 'franja' : 'franjas'} de ${datos.duracionMinutos} min en ${diasConFranjas} ${diasConFranjas === 1 ? 'día' : 'días'}, del ${fechaLegible(previas[0].fecha)} al ${fechaLegible(previas[previas.length - 1].fecha)}, con ${datos.cupos} ${datos.cupos === 1 ? 'cupo' : 'cupos'} cada una.`
            : 'Elige los días, el horario y la vigencia para ver cuántas franjas se generan.'}
        </Text>
        {previas.length > 0 && datos.excepciones.length > 0 ? (
          <Text variant="bodySmall" style={estilos.textoPrevia}>
            {`Sin las ${datos.excepciones.length} ${datos.excepciones.length === 1 ? 'fecha excluida' : 'fechas excluidas'} ni los festivos.`}
          </Text>
        ) : null}
      </View>

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={() => guardar()}
        loading={guardando}
        disabled={guardando || (original != null && !isDirty)}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={original ? 'Guardar cambios de la jornada y regenerar sus franjas' : 'Crear la jornada y generar sus franjas'}
      >
        {original ? 'Guardar y regenerar franjas' : 'Crear jornada'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.s },
  grupo: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chipExcluida: { backgroundColor: colores.superficieVariante },
  previa: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tituloPrevia: { color: colores.primarioOscuro, fontFamily: fuentes.negrita },
  textoPrevia: { color: colores.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
});
