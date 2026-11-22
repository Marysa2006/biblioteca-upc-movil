/**
 * Formulario de la comunidad para solicitar un espacio (HU-18).
 * - La fecha y la hora de inicio llegan del calendario (HU-17); la de fin empieza una hora después.
 * - CA3: valida antes de enviar el día hábil, el horario y al menos 1 asistente
 *   (esquemaSolicitudReservaCompleta); la API vuelve a validar.
 * - CA2: si el horario está ocupado, muestra los horarios libres que sugiere la API; al tocar
 *   uno, se pone en el formulario y la persona lo envía.
 * - CA1: al registrarse, el formulario cambia a una confirmación.
 *
 * Versión 1.1 (#251): por pasos con PasosFormulario, **Solicitud · Tus datos · Términos**, como la
 * asesoría y la capacitación. "Siguiente" valida solo los campos del paso y "Enviar" está solo en
 * el último, deshabilitado hasta aceptar los términos.
 * - Solicitud: fecha y horario, propósito, asistentes, recursos de apoyo y novedades.
 * - La sede del espacio no se pregunta: es la del espacio (hoy, Valledupar). En Tus datos va la
 *   sede de la persona.
 * - Tus datos: prellenados; la identificación sale de la cuenta y solo se pide si no la tiene.
 * - Términos: TERMINOS_ESPACIOS.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TouchableRipple } from 'react-native-paper';

import { ChipsOpcion } from '@/components/asesorias/ChipsOpcion';
import {
  SeccionDatosSolicitante,
  type CampoSolicitante,
} from '@/components/solicitudes/SeccionDatosSolicitante';
import { SeccionTerminos } from '@/components/solicitudes/SeccionTerminos';
import { AvisoError, PasosFormulario, Upecito } from '@/components/ui';
import {
  alternativasDeError,
  useSolicitarReserva,
  type AlternativaReserva,
} from '@/hooks/useReservas';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Espacio, Parametros, Perfil, RecursoApoyo, Usuario } from '@/types';
import { fechaCompleta, sumarMeses } from '@/utils/calendario';
import { TERMINOS_ESPACIOS } from '@/utils/constantes';
import { mensajeErrorGuardar } from '@/utils/errores';
import { esFechaValida, esHoraValida, hoyISO, sumarHoras } from '@/utils/fechas';
import { camposDelPaso, primerMensajeDeError, primerPasoConError } from '@/utils/pasos';
import {
  esquemaSolicitudReservaCompleta,
  LARGO_MAXIMO_NOVEDADES_RESERVA,
  MESES_RESERVA,
  motivoDiaReserva,
  RECURSOS_APOYO,
  sedeDeEspacio,
  valoresInicialesReservaCompleta,
  type FormularioSolicitudCompleta,
} from '@/utils/reservas';
import {
  aDatosSolicitante,
  datosSolicitanteDe,
  valoresSolicitante,
  type ValoresSolicitante,
} from '@/utils/solicitante';

import { CampoFormulario } from './CampoFormulario';

type Valores = FormularioSolicitudCompleta;
type PasoReserva = 'solicitud' | 'datos' | 'terminos';

const CONFIRMACION =
  'Solicitud enviada. Quedó pendiente de aprobación y te avisaremos cuando la revisen.';

const PASOS: { valor: PasoReserva; etiqueta: string }[] = [
  { valor: 'solicitud', etiqueta: 'Solicitud' },
  { valor: 'datos', etiqueta: 'Tus datos' },
  { valor: 'terminos', etiqueta: 'Términos' },
];
const ORDEN_PASOS = PASOS.map(({ valor }) => valor);

/** En qué paso está cada campo, para validar el paso y volver al que tiene errores. */
const PASO_DE_CAMPO: Record<keyof Valores, PasoReserva> = {
  fecha: 'solicitud',
  horaInicio: 'solicitud',
  horaFin: 'solicitud',
  proposito: 'solicitud',
  asistentes: 'solicitud',
  requerimientos: 'solicitud',
  sede: 'datos',
  recursos: 'solicitud',
  tipo: 'datos',
  nombreCompleto: 'datos',
  identificacion: 'datos',
  correo: 'datos',
  celular: 'datos',
  nivel: 'datos',
  facultad: 'datos',
  programa: 'datos',
  semestre: 'datos',
  terminosAceptados: 'terminos',
};

/** Orden de los campos en pantalla, para anunciar el primero con error en iOS. */
const CAMPOS: (keyof Valores)[] = [
  'fecha',
  'horaInicio',
  'horaFin',
  'proposito',
  'asistentes',
  'recursos',
  'requerimientos',
  'nombreCompleto',
  'identificacion',
  'correo',
  'celular',
  'sede',
  'nivel',
  'facultad',
  'programa',
  'terminosAceptados',
];

const CAMPOS_SOLICITANTE: CampoSolicitante[] = [
  'tipo',
  'nombreCompleto',
  'identificacion',
  'correo',
  'celular',
  'sede',
  'nivel',
  'facultad',
  'programa',
  'semestre',
];

/** "No requiere" es la lista vacía de recursos. */
const NO_REQUIERE = 'ninguno';
type OpcionRecurso = RecursoApoyo | typeof NO_REQUIERE;
const OPCIONES_RECURSOS: { valor: OpcionRecurso; etiqueta: string }[] = [
  ...RECURSOS_APOYO,
  { valor: NO_REQUIERE, etiqueta: 'No requiere' },
];

type Props = {
  espacio: Espacio;
  parametros: Parametros;
  usuario: Usuario;
  /** El perfil (HU-06), si cargó: su teléfono prellena el celular. */
  perfil?: Perfil;
  /** Fecha ('AAAA-MM-DD') y hora de inicio ('HH:MM') que vienen del calendario. */
  fecha?: string;
  hora?: string;
};

/** "Martes 21 de octubre · 10:00 – 12:00". */
const describir = ({ fecha, horaInicio, horaFin }: AlternativaReserva) =>
  `${fechaCompleta(fecha)} · ${horaInicio} – ${horaFin}`;

export function FormularioSolicitudReserva({
  espacio: lugar,
  parametros,
  usuario,
  perfil,
  fecha,
  hora,
}: Props) {
  const [hoy] = useState(hoyISO);
  const solicitud = useSolicitarReserva();
  const alternativas = alternativasDeError(solicitud.error);
  const [enviada, setEnviada] = useState(false);
  const [elegida, setElegida] = useState<AlternativaReserva | null>(null);
  const [paso, setPaso] = useState<PasoReserva>('solicitud');
  // La reserva exige la identificación; sale de la cuenta y solo se pide si no la tiene.
  const pedirIdentificacion = !usuario.identificacion;

  const horaValida = hora && esHoraValida(hora) ? hora : '';
  const { control, handleSubmit, setValue, trigger, getFieldState, formState } = useForm<Valores>({
    resolver: zodResolver(esquemaSolicitudReservaCompleta({ parametros, espacio: lugar, hoy })),
    defaultValues: {
      ...valoresInicialesReservaCompleta(),
      // Con la sede de la persona, si la cuenta la tiene.
      ...valoresSolicitante(datosSolicitanteDe(usuario, perfil)),
      fecha: fecha && esFechaValida(fecha) ? fecha : '',
      horaInicio: horaValida,
      horaFin: horaValida ? sumarHoras(horaValida, 1) : '',
    },
    // Al salir de un campo ya tocado se valida: los errores de un paso se corrigen al escribir.
    mode: 'onTouched',
  });
  const errores = formState.errors;
  // Una vez que hay errores a la vista, cada cambio vuelve a validar su campo.
  const validar = {
    shouldValidate: formState.isSubmitted || Object.keys(errores).length > 0,
  };

  const [recursos, terminosAceptados] = useWatch({
    control,
    name: ['recursos', 'terminosAceptados'],
  });
  const valoresDatos = useWatch({ control, name: CAMPOS_SOLICITANTE });
  const solicitante = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo, i) => [campo, valoresDatos[i] ?? '']),
  ) as ValoresSolicitante;
  const erroresDatos = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo) => [campo, errores[campo]?.message]).filter(([, m]) => m),
  ) as Partial<Record<CampoSolicitante, string>>;

  const avisoElegida = elegida
    ? `Elegiste el ${describir(elegida).toLowerCase()}. Revisa y envía.`
    : null;
  const aviso = enviada ? CONFIRMACION : avisoElegida;
  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const anunciar = (mensaje?: string) => {
    if (Platform.OS === 'ios' && mensaje) AccessibilityInfo.announceForAccessibility(mensaje);
  };

  const indice = ORDEN_PASOS.indexOf(paso);

  /** "Siguiente": valida solo los campos de este paso y, si están bien, avanza. */
  const avanzar = async () => {
    const campos = camposDelPaso(PASO_DE_CAMPO, paso);
    if (await trigger(campos)) {
      setPaso(ORDEN_PASOS[indice + 1]);
      return;
    }
    anunciar(
      CAMPOS.filter((campo) => campos.includes(campo))
        .map((campo) => getFieldState(campo).error?.message)
        .find(Boolean),
    );
  };

  const enviar = (datos: Valores) => {
    setElegida(null);
    const requerimientos = datos.requerimientos.trim();
    solicitud.mutate(
      {
        espacioId: lugar.id,
        fecha: datos.fecha.trim(),
        horaInicio: datos.horaInicio.trim(),
        horaFin: datos.horaFin.trim(),
        proposito: datos.proposito.trim(),
        asistentes: Number(datos.asistentes),
        ...(requerimientos ? { requerimientos } : {}),
        // La sede del espacio no se pregunta (#251); la de la persona va en datosSolicitante.
        sede: sedeDeEspacio(lugar),
        recursos: datos.recursos as RecursoApoyo[],
        datosSolicitante: aDatosSolicitante(datos),
        terminosAceptados: datos.terminosAceptados,
      },
      { onSuccess: () => setEnviada(true) },
    );
  };

  // Si al enviar algo falla por la validación (por ejemplo, el horario dejó de servir), vuelve a
  // ese paso.
  const alFaltarDatos = (conError: FieldErrors<Valores>) => {
    const primero = primerPasoConError(conError, PASO_DE_CAMPO, ORDEN_PASOS);
    if (primero) setPaso(primero);
    anunciar(primerMensajeDeError(conError, CAMPOS));
  };

  const elegirAlternativa = (alternativa: AlternativaReserva) => {
    const opciones = { shouldValidate: true };
    setValue('fecha', alternativa.fecha, opciones);
    setValue('horaInicio', alternativa.horaInicio, opciones);
    setValue('horaFin', alternativa.horaFin, opciones);
    solicitud.reset();
    setElegida(alternativa);
  };

  const cambiarRecursos = (elegidos: OpcionRecurso[]) => {
    // "No requiere" deja la lista vacía; elegir un recurso quita "No requiere".
    const ultimo = elegidos[elegidos.length - 1];
    const lista = ultimo === NO_REQUIERE ? [] : elegidos.filter((valor) => valor !== NO_REQUIERE);
    setValue('recursos', lista, validar);
  };

  if (enviada) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Upecito pose="listo" />
        <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
          {CONFIRMACION}
        </Text>
        <View style={estilos.botones}>
          <Button
            mode="contained"
            onPress={() => router.back()}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Volver al calendario de ${lugar.nombre}`}
          >
            Volver al calendario
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.replace('/')}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ir a Inicio"
          >
            Ir a Inicio
          </Button>
        </View>
      </View>
    );
  }

  const guardando = solicitud.isPending;

  return (
    <PasosFormulario
      pasos={PASOS}
      paso={paso}
      onAnterior={() => setPaso(ORDEN_PASOS[indice - 1])}
      onSiguiente={() => void avanzar()}
      onEnviar={() => handleSubmit(enviar, alFaltarDatos)()}
      enviando={guardando}
      etiquetaEnviar={`Solicitar la reserva de ${lugar.nombre}`}
      puedeEnviar={terminosAceptados}
      avisos={
        <>
          {elegida ? (
            <View style={estilos.elegida} accessibilityLiveRegion="polite">
              <Icon source="information-outline" size={20} color={colores.primario} />
              <Text variant="bodyMedium" style={estilos.textoElegida}>
                {avisoElegida}
              </Text>
            </View>
          ) : null}
          {solicitud.error ? (
            <View style={estilos.error}>
              <AvisoError mensaje={mensajeErrorGuardar(solicitud.error)} />
              {alternativas.length > 0 ? (
                <View style={estilos.alternativas}>
                  <Text
                    variant="titleSmall"
                    style={estilos.tituloSeccion}
                    accessibilityRole="header"
                  >
                    Estos horarios están libres:
                  </Text>
                  {alternativas.map((alternativa) => (
                    <View key={describir(alternativa)} style={estilos.alternativa}>
                      <TouchableRipple
                        onPress={() => elegirAlternativa(alternativa)}
                        accessibilityRole="button"
                        accessibilityLabel={`Usar el ${describir(alternativa)}`}
                      >
                        <View style={estilos.contenidoAlternativa}>
                          <Text variant="bodyMedium" style={estilos.textoAlternativa}>
                            {describir(alternativa)}
                          </Text>
                          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
                        </View>
                      </TouchableRipple>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      }
    >
      {paso === 'solicitud' ? (
        <View style={estilos.tarjeta}>
          <Bloque titulo="Fecha y horario">
            <CampoFormulario
              control={control}
              nombre="fecha"
              etiqueta="Fecha"
              tipo="fecha"
              motivoNoElegible={(dia) => motivoDiaReserva(dia, parametros, hoy)}
              mesMinimo={hoy}
              mesMaximo={sumarMeses(hoy, MESES_RESERVA)}
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="horaInicio"
              etiqueta="Hora de inicio"
              tipo="hora"
              pasoMinutos={60}
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="horaFin"
              etiqueta="Hora de fin"
              tipo="hora"
              pasoMinutos={60}
              deshabilitado={guardando}
            />
          </Bloque>

          <Bloque titulo="La reserva">
            <CampoFormulario
              control={control}
              nombre="proposito"
              etiqueta="Propósito"
              placeholder="Por ejemplo: estudio grupal"
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="asistentes"
              etiqueta={`Número de asistentes (hasta ${lugar.capacidad})`}
              tipo="numero"
              minimo={1}
              maximo={lugar.capacidad}
              deshabilitado={guardando}
            />
          </Bloque>

          <Bloque titulo="Recursos de apoyo">
            <ChipsOpcion<OpcionRecurso>
              titulo="¿Qué necesitas en el espacio?"
              opciones={OPCIONES_RECURSOS}
              elegidos={recursos.length > 0 ? (recursos as OpcionRecurso[]) : [NO_REQUIERE]}
              onCambiar={cambiarRecursos}
              multiple
              mensajeError={errores.recursos?.message}
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="requerimientos"
              etiqueta={`Novedades (opcional, hasta ${LARGO_MAXIMO_NOVEDADES_RESERVA} caracteres)`}
              placeholder="Lo que quieras que la biblioteca sepa antes de la reserva"
              multilinea
              deshabilitado={guardando}
            />
          </Bloque>
        </View>
      ) : null}

      {paso === 'datos' ? (
        <View style={estilos.tarjeta}>
          <Text variant="bodySmall" style={estilos.secundario}>
            Vienen de tu cuenta; corrige lo que haga falta.
          </Text>
          <SeccionDatosSolicitante
            valores={solicitante}
            onCambiar={(campo, valor) => setValue(campo, valor, validar)}
            errores={erroresDatos}
            pedirIdentificacion={pedirIdentificacion}
            deshabilitado={guardando}
          />
        </View>
      ) : null}

      {paso === 'terminos' ? (
        <View style={estilos.tarjeta}>
          <SeccionTerminos
            texto={TERMINOS_ESPACIOS}
            aceptados={terminosAceptados}
            onCambiar={(acepta) => setValue('terminosAceptados', acepta, validar)}
            mensajeError={errores.terminosAceptados?.message}
            deshabilitado={guardando}
          />
        </View>
      ) : null}
    </PasosFormulario>
  );
}

/** Un bloque del paso con su subtítulo. */
function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.bloque}>
      <Text variant="titleSmall" style={estilos.tituloBloque} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  bloque: { gap: espacio.xs },
  tituloBloque: { color: colores.primario, fontFamily: fuentes.seminegrita },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  elegida: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoElegida: { flex: 1, color: colores.texto },
  error: { gap: espacio.s },
  alternativas: { gap: espacio.s },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  alternativa: {
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  contenidoAlternativa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.m,
  },
  textoAlternativa: { flex: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  botones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
