/**
 * Solicitud de asesoría con fecha y hora (#249, HU-14 en la versión 1.1). Reemplaza la lista de
 * franjas: la persona pide el día y la hora, y la biblioteca confirma y asigna el facilitador.
 * En pestañas, como Parámetros generales: **Solicitud · Tus datos · Términos**. Al enviar con
 * errores, salta a la primera pestaña con errores y la marca con `alerta`.
 * - CA1: con todo completo, la solicitud queda pendiente y la confirmación sale en el mismo lugar.
 * - CA2: el calendario tacha los días sin atención o a menos de 72 h; la hora fuera del horario
 *   o sin la anticipación muestra el error bajo el campo.
 * - CA5: cada campo con su etiqueta, los errores con accessibilityLiveRegion (en iOS los anuncia
 *   el formulario) y áreas de 44×44.
 * Los campos y las reglas son los de `POST advisories/appointments/` del Backend.
 * No consulta ni guarda: la pantalla le pasa los datos y envía con onEnviar.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { ChipsOpcion } from '@/components/asesorias/ChipsOpcion';
import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import {
  SeccionDatosSolicitante,
  type CampoSolicitante,
} from '@/components/solicitudes/SeccionDatosSolicitante';
import { SeccionTerminos } from '@/components/solicitudes/SeccionTerminos';
import {
  AvisoError,
  CampoHora,
  CampoNumerico,
  PestanasFiltro,
  Upecito,
  type OpcionPestana,
} from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type {
  ModalidadAsesoria,
  NuevaSolicitudCita,
  Parametros,
  Perfil,
  TemaAsesoria,
  Usuario,
} from '@/types';
import {
  aNuevaSolicitudCita,
  esquemaSolicitudCita,
  horasInicioCita,
  MODALIDADES_ASESORIA,
  motivoDiaNoElegibleCita,
  PESTANA_DE_CAMPO_CITA,
  valoresInicialesCita,
  type PestanaCita,
  type ValoresSolicitudCita,
} from '@/utils/asesorias';
import { fechaCompleta, sumarDias } from '@/utils/calendario';
import { LARGO_MAXIMO_ASIGNATURA, LARGO_MAXIMO_NOVEDADES } from '@/utils/capacitaciones';
import { TERMINOS_FORMACION } from '@/utils/constantes';
import { hoyISO } from '@/utils/fechas';
import {
  datosSolicitanteDe,
  LARGO_MAXIMO_NOMBRE,
  valoresSolicitante,
  type ValoresSolicitante,
} from '@/utils/solicitante';

const LARGO_MAXIMO_NECESIDAD = 300;
/** Hasta cuántos días adelante se ofrece el calendario. */
const DIAS_CALENDARIO = 90;

const CONFIRMACION =
  'Tu solicitud quedó pendiente. La biblioteca confirma la fecha y la hora por teléfono o aquí ' +
  'en la app, y te asigna quién te atiende. Te avisamos con una notificación.';

const PESTANAS: { valor: PestanaCita; etiqueta: string }[] = [
  { valor: 'solicitud', etiqueta: 'Solicitud' },
  { valor: 'datos', etiqueta: 'Tus datos' },
  { valor: 'terminos', etiqueta: 'Términos' },
];

/** Orden de los campos en pantalla, para anunciar el primero con error en iOS. */
const CAMPOS: (keyof ValoresSolicitudCita)[] = [
  'fecha',
  'hora',
  'modalidad',
  'personas',
  'participantes',
  'necesidad',
  'asignatura',
  'novedades',
  'tipo',
  'nombreCompleto',
  'correo',
  'celular',
  'nivel',
  'facultad',
  'programa',
  'semestre',
  'terminosAceptados',
];

const CAMPOS_SOLICITANTE: CampoSolicitante[] = [
  'tipo',
  'nombreCompleto',
  'identificacion',
  'correo',
  'celular',
  'nivel',
  'facultad',
  'programa',
  'semestre',
];

type Props = {
  tema: TemaAsesoria;
  parametros: Parametros;
  usuario: Usuario;
  /** El perfil (HU-06), si cargó: su teléfono prellena el celular. */
  perfil?: Perfil;
  guardando: boolean;
  /** Error de la API al enviar, con mensajeErrorGuardar(). */
  mensajeError: string | null;
  /** La solicitud ya se registró (CA1). */
  enviada: boolean;
  onEnviar: (nueva: NuevaSolicitudCita) => void;
};

export function FormularioSolicitudCita({
  tema,
  parametros,
  usuario,
  perfil,
  guardando,
  mensajeError,
  enviada,
  onEnviar,
}: Props) {
  const hoy = hoyISO();
  const maximoPersonas = parametros.maximoPersonasAsesoria;
  const [pestana, setPestana] = useState<PestanaCita>('solicitud');
  const [hayErrores, setHayErrores] = useState(false);
  const { control, handleSubmit, setValue, formState } = useForm<ValoresSolicitudCita>({
    resolver: zodResolver(esquemaSolicitudCita(parametros)),
    defaultValues: valoresInicialesCita(valoresSolicitante(datosSolicitanteDe(usuario, perfil))),
  });
  const errores = formState.errors;
  const validar = { shouldValidate: formState.isSubmitted };

  const [fecha, hora, modalidad, personas, participantes, terminosAceptados] = useWatch({
    control,
    name: ['fecha', 'hora', 'modalidad', 'personas', 'participantes', 'terminosAceptados'],
  });
  const valoresDatos = useWatch({ control, name: CAMPOS_SOLICITANTE });
  const solicitante = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo, i) => [campo, valoresDatos[i] ?? '']),
  ) as ValoresSolicitante;
  const erroresDatos = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo) => [campo, errores[campo]?.message]).filter(([, m]) => m),
  ) as Partial<Record<CampoSolicitante, string>>;

  const numeroPersonas = Number(personas) || 1;
  const otros = Math.max(0, Math.min(numeroPersonas, maximoPersonas) - 1);
  const horario = fecha ? horasInicioCita(fecha, parametros) : null;

  // Un campo por cada uno de los otros integrantes: al cambiar Personas, la lista se ajusta.
  useEffect(() => {
    if (participantes.length !== otros) {
      const ajustados = Array.from({ length: otros }, (_, i) => participantes[i] ?? '');
      setValue('participantes', ajustados);
    }
  }, [otros, participantes, setValue]);

  const pestanaConError = (errs: FieldErrors<ValoresSolicitudCita>) =>
    PESTANAS.find(({ valor }) =>
      (Object.keys(errs) as (keyof ValoresSolicitudCita)[]).some(
        (campo) => PESTANA_DE_CAMPO_CITA[campo] === valor,
      ),
    )?.valor;

  const enviar = handleSubmit(
    (datos) => {
      setHayErrores(false);
      onEnviar(aNuevaSolicitudCita(tema.id, datos));
    },
    (conError) => {
      setHayErrores(true);
      const primera = pestanaConError(conError);
      if (primera) setPestana(primera);
      // En Android lo anuncia accessibilityLiveRegion bajo cada campo.
      const primero = CAMPOS.find((campo) => conError[campo] != null);
      const error = primero ? conError[primero] : undefined;
      const mensaje = Array.isArray(error)
        ? error.find((e) => e?.message)?.message
        : (error as { message?: string } | undefined)?.message;
      if (Platform.OS === 'ios' && mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
    },
  );

  if (enviada) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Upecito pose="listo" />
        <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
          {CONFIRMACION}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.replace('/solicitudes')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Ver mis solicitudes"
        >
          Ver mis solicitudes
        </Button>
        <Button
          mode="text"
          onPress={() => router.replace('/')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Ir a Inicio"
        >
          Ir a Inicio
        </Button>
      </View>
    );
  }

  const opcionesPestanas: OpcionPestana<PestanaCita>[] = PESTANAS.map(({ valor, etiqueta }) => ({
    valor,
    etiqueta,
    alerta: hayAlgunError(errores, valor),
  }));

  const indice = PESTANAS.findIndex(({ valor }) => valor === pestana);
  const siguiente = PESTANAS[indice + 1];

  return (
    <View style={estilos.formulario}>
      <PestanasFiltro
        opciones={opcionesPestanas}
        valor={pestana}
        onCambiar={setPestana}
        descripcion="Secciones de la solicitud de asesoría"
      />

      {pestana === 'solicitud' ? (
        <View style={estilos.tarjeta}>
          <SelectorFecha
            etiqueta="Fecha"
            valor={fecha}
            onCambiar={(nueva) => setValue('fecha', nueva, validar)}
            motivoNoElegible={(dia) => motivoDiaNoElegibleCita(dia, parametros)}
            mesMinimo={hoy}
            mesMaximo={sumarDias(hoy, DIAS_CALENDARIO)}
            mensajeError={errores.fecha?.message}
            descripcion={fecha ? fechaCompleta(fecha) : undefined}
            deshabilitado={guardando}
          />
          <Text variant="bodySmall" style={estilos.secundario}>
            {`Con al menos ${parametros.horasMinimasSolicitud} horas de anticipación. La biblioteca confirma la fecha.`}
          </Text>

          <CampoHora
            etiqueta="Hora"
            valor={hora}
            onCambiar={(nueva) => setValue('hora', nueva, validar)}
            mensajeError={errores.hora?.message}
            deshabilitado={guardando}
          />
          <Text variant="bodySmall" style={estilos.secundario}>
            {horario
              ? `Ese día, entre las ${horario.desde} y las ${horario.hasta}. La asesoría dura ${parametros.duracionAsesoriaMinutos} minutos.`
              : `La asesoría dura ${parametros.duracionAsesoriaMinutos} minutos, dentro del horario de atención.`}
          </Text>

          <ChipsOpcion<ModalidadAsesoria>
            titulo="Modalidad"
            opciones={MODALIDADES_ASESORIA.map(({ valor, etiqueta }) => ({ valor, etiqueta }))}
            elegidos={modalidad ? [modalidad as ModalidadAsesoria] : []}
            onCambiar={([elegida]) => setValue('modalidad', elegida ?? '', validar)}
            ayuda={
              modalidad === 'virtual'
                ? 'El enlace de la reunión te llega cuando la biblioteca apruebe la solicitud.'
                : undefined
            }
            mensajeError={errores.modalidad?.message}
            deshabilitado={guardando}
          />

          <Controller
            control={control}
            name="personas"
            render={({ field: { value, onChange, onBlur } }) => (
              <CampoNumerico
                etiqueta="¿Cuántas personas asisten?"
                valor={value}
                onCambiar={onChange}
                onBlur={onBlur}
                minimo={1}
                maximo={maximoPersonas}
                mensajeError={errores.personas?.message}
                deshabilitado={guardando}
              />
            )}
          />
          <Text variant="bodySmall" style={estilos.secundario}>
            {`Contándote a ti, hasta ${maximoPersonas}. Para un grupo mayor, solicita una capacitación.`}
          </Text>

          {otros > 0 ? (
            <View style={estilos.grupo}>
              <Text variant="bodyMedium" style={estilos.subtitulo} accessibilityRole="header">
                Los otros integrantes
              </Text>
              {Array.from({ length: otros }, (_, i) => (
                <Controller
                  key={i}
                  control={control}
                  name={`participantes.${i}`}
                  render={({ field: { ref, value, onChange, onBlur } }) => (
                    <CampoTexto
                      refCampo={ref}
                      etiqueta={`Nombre de la persona ${i + 2}`}
                      valor={value ?? ''}
                      onCambiar={onChange}
                      onBlur={onBlur}
                      mensajeError={errores.participantes?.[i]?.message}
                      deshabilitado={guardando}
                      largoMaximo={LARGO_MAXIMO_NOMBRE}
                      autoCapitalize="words"
                    />
                  )}
                />
              ))}
            </View>
          ) : null}

          <Controller
            control={control}
            name="necesidad"
            render={({ field: { ref, value, onChange, onBlur } }) => (
              <CampoTexto
                refCampo={ref}
                etiqueta="¿Qué necesitas?"
                valor={value}
                onCambiar={onChange}
                onBlur={onBlur}
                mensajeError={errores.necesidad?.message}
                ayuda={`${value.length} de ${LARGO_MAXIMO_NECESIDAD}. Por ejemplo, revisar las normas APA de tu trabajo de grado.`}
                deshabilitado={guardando}
                largoMaximo={LARGO_MAXIMO_NECESIDAD}
                multilinea
              />
            )}
          />
          <Controller
            control={control}
            name="asignatura"
            render={({ field: { ref, value, onChange, onBlur } }) => (
              <CampoTexto
                refCampo={ref}
                etiqueta="Asignatura (opcional)"
                valor={value}
                onCambiar={onChange}
                onBlur={onBlur}
                mensajeError={errores.asignatura?.message}
                deshabilitado={guardando}
                largoMaximo={LARGO_MAXIMO_ASIGNATURA}
              />
            )}
          />
          <Controller
            control={control}
            name="novedades"
            render={({ field: { ref, value, onChange, onBlur } }) => (
              <CampoTexto
                refCampo={ref}
                etiqueta="Novedades (opcional)"
                valor={value}
                onCambiar={onChange}
                onBlur={onBlur}
                mensajeError={errores.novedades?.message}
                ayuda="Lo que quieras que la biblioteca sepa antes de la asesoría."
                deshabilitado={guardando}
                largoMaximo={LARGO_MAXIMO_NOVEDADES}
                multilinea
              />
            )}
          />
        </View>
      ) : null}

      {pestana === 'datos' ? (
        <View style={estilos.tarjeta}>
          <Text variant="bodySmall" style={estilos.secundario}>
            Los traemos de tu cuenta y tu perfil. Revísalos y corrige lo que haga falta.
          </Text>
          <SeccionDatosSolicitante
            valores={solicitante}
            onCambiar={(campo, valor) => setValue(campo, valor, validar)}
            errores={erroresDatos}
            deshabilitado={guardando}
          />
        </View>
      ) : null}

      {pestana === 'terminos' ? (
        <View style={estilos.tarjeta}>
          <SeccionTerminos
            texto={TERMINOS_FORMACION}
            aceptados={terminosAceptados}
            onCambiar={(acepta) => setValue('terminosAceptados', acepta, validar)}
            mensajeError={errores.terminosAceptados?.message}
            deshabilitado={guardando}
          />
        </View>
      ) : null}

      {hayErrores && Object.keys(errores).length > 0 ? (
        <AvisoError mensaje="Revisa los campos marcados en rojo; las pestañas con el ícono de aviso tienen errores." />
      ) : null}
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      {siguiente ? (
        <Button
          mode="outlined"
          icon="arrow-right"
          onPress={() => setPestana(siguiente.valor)}
          disabled={guardando}
          contentStyle={estilos.contenidoBotonSiguiente}
          accessibilityRole="button"
          accessibilityLabel={`Siguiente: ${siguiente.etiqueta}`}
        >
          {`Siguiente: ${siguiente.etiqueta}`}
        </Button>
      ) : null}
      <Button
        mode="contained"
        onPress={() => enviar()}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.textoBoton}
        accessibilityRole="button"
        accessibilityLabel="Enviar la solicitud de asesoría"
      >
        Enviar solicitud
      </Button>
    </View>
  );
}

/** ¿Hay algún error en los campos de esa pestaña? */
function hayAlgunError(errores: FieldErrors<ValoresSolicitudCita>, pestana: PestanaCita): boolean {
  return (Object.keys(errores) as (keyof ValoresSolicitudCita)[]).some(
    (campo) => PESTANA_DE_CAMPO_CITA[campo] === pestana,
  );
}

type CampoTextoProps = {
  refCampo?: (instancia: unknown) => void;
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  onBlur?: () => void;
  mensajeError?: string;
  ayuda?: string;
  deshabilitado: boolean;
  largoMaximo?: number;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  multilinea?: boolean;
};

/** Un dato de texto con su error (o su ayuda) debajo, que Android anuncia al aparecer. */
function CampoTexto({
  refCampo,
  etiqueta,
  valor,
  onCambiar,
  onBlur,
  mensajeError,
  ayuda,
  deshabilitado,
  largoMaximo,
  autoCapitalize = 'sentences',
  multilinea = false,
}: CampoTextoProps) {
  return (
    <View>
      <TextInput
        ref={refCampo}
        mode="outlined"
        label={etiqueta}
        value={valor}
        onChangeText={onCambiar}
        onBlur={onBlur}
        error={mensajeError != null}
        disabled={deshabilitado}
        autoCapitalize={autoCapitalize}
        maxLength={largoMaximo}
        multiline={multilinea}
        style={[estilos.campo, multilinea && estilos.campoLargo]}
        accessibilityLabel={etiqueta}
      />
      <View accessibilityLiveRegion="polite">
        <HelperText
          type={mensajeError ? 'error' : 'info'}
          visible={mensajeError != null || ayuda != null}
        >
          {mensajeError ?? ayuda}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  grupo: { gap: espacio.xs },
  subtitulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  campo: { backgroundColor: colores.superficie },
  // Crece con el texto; minHeight para que se vea que es un campo largo.
  campoLargo: { minHeight: espacio.xl * 3 },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  // row-reverse deja la flecha a la derecha del texto.
  contenidoBotonSiguiente: { flexDirection: 'row-reverse', paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
