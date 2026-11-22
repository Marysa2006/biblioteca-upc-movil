/**
 * Formulario de la comunidad para solicitar una capacitación (HU-10).
 * - CA2: valida antes de enviar con esquemaSolicitudCapacitacion; cada error va bajo su campo y,
 *   si falta algo, un aviso arriba del botón lo anuncia. La API vuelve a validar.
 * - CA3: el calendario tacha los días pasados y los no hábiles, como los demás (#205), pero se
 *   pueden tocar: el calendario se cierra, el motivo sale en rojo bajo el campo y, aparte y en
 *   verde, la fecha sugerida (sugerirFechaHabil) con "Usar esta fecha". El día tocado no queda
 *   elegido. Si la API rechaza la fecha al enviar (por ejemplo, menos de 24 h), su mensaje sale
 *   en rojo y la misma sugerencia va debajo, fuera del aviso.
 * - CA1: al registrarse, el formulario cambia a una confirmación.
 *
 * Versión 1.1 (#251): por pasos con PasosFormulario, **Solicitud · Tus datos · Términos**, como
 * la asesoría. "Siguiente" valida solo los campos del paso y "Enviar" está solo en el último; si
 * al enviar algo falla por la validación, vuelve a ese paso.
 * - "Asignatura y grupo" es un solo campo (`grupo`, el `group_or_subject` del Backend): la
 *   asignatura no va aparte, y los nombres de los participantes no se piden (la asistencia queda
 *   con el QR).
 * - Tus datos: prellenados con la cuenta y el perfil para confirmarlos; sin identificación.
 * - Términos: TERMINOS_FORMACION, obligatorios.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  Icon,
  RadioButton,
  SegmentedButtons,
  Text,
  TouchableRipple,
} from 'react-native-paper';

import { CampoFormulario } from '@/components/reservas/CampoFormulario';
import {
  SeccionDatosSolicitante,
  type CampoSolicitante,
} from '@/components/solicitudes/SeccionDatosSolicitante';
import { SeccionTerminos } from '@/components/solicitudes/SeccionTerminos';
import { AvisoError, PasosFormulario, Upecito } from '@/components/ui';
import {
  fechaSugeridaDeError,
  useSolicitarCapacitacion,
  type FormularioCapacitacion,
} from '@/hooks/useCapacitaciones';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { LineaFormacion, ModalidadCapacitacion, Parametros, Perfil, Usuario } from '@/types';
import { fechaCompleta, sumarMeses } from '@/utils/calendario';
import {
  esquemaSolicitudCapacitacionCompleta,
  LARGO_MAXIMO_GRUPO,
  LARGO_MAXIMO_NOVEDADES,
  mensajeDiaNoHabil,
  motivoDiaCapacitacion,
  LARGO_MAXIMO_OBJETIVO,
  MAXIMO_PARTICIPANTES,
  MESES_CAPACITACION,
  MODALIDADES_CAPACITACION,
  VALORES_INICIALES_CAPACITACION_COMPLETA,
  type ValoresSolicitudCapacitacionCompleta,
} from '@/utils/capacitaciones';
import { TERMINOS_FORMACION } from '@/utils/constantes';
import { mensajeErrorGuardar } from '@/utils/errores';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { esDiaHabil, sugerirFechaHabil } from '@/utils/parametros';
import { camposDelPaso, primerMensajeDeError, primerPasoConError } from '@/utils/pasos';
import {
  aDatosSolicitante,
  datosSolicitanteDe,
  valoresSolicitante,
  type ValoresSolicitante,
} from '@/utils/solicitante';

type Valores = ValoresSolicitudCapacitacionCompleta;
type PestanaCapacitacion = 'solicitud' | 'datos' | 'terminos';

const PESTANAS: { valor: PestanaCapacitacion; etiqueta: string }[] = [
  { valor: 'solicitud', etiqueta: 'Solicitud' },
  { valor: 'datos', etiqueta: 'Tus datos' },
  { valor: 'terminos', etiqueta: 'Términos' },
];
const ORDEN_PESTANAS = PESTANAS.map(({ valor }) => valor);

/** En qué pestaña está cada campo, para saltar a la primera con errores. */
const PESTANA_DE_CAMPO: Record<keyof Valores, PestanaCapacitacion> = {
  lineaId: 'solicitud',
  modalidad: 'solicitud',
  fecha: 'solicitud',
  hora: 'solicitud',
  objetivo: 'solicitud',
  grupo: 'solicitud',
  participantes: 'solicitud',
  asignatura: 'solicitud',
  nombresParticipantes: 'solicitud',
  novedades: 'solicitud',
  tipo: 'datos',
  nombreCompleto: 'datos',
  identificacion: 'datos',
  correo: 'datos',
  celular: 'datos',
  sede: 'datos',
  nivel: 'datos',
  facultad: 'datos',
  programa: 'datos',
  semestre: 'datos',
  terminosAceptados: 'terminos',
};

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

const CONFIRMACION =
  'Solicitud enviada. Quedó pendiente y te avisaremos cuando la biblioteca la revise.';

/** Hora con la que se busca la fecha sugerida mientras la persona no elige una. */
const HORA_REFERENCIA = '12:00';

/** Orden de los campos en pantalla, para anunciar el primero que falta (CA2). */
const ORDEN_CAMPOS: (keyof Valores)[] = [
  'lineaId',
  'modalidad',
  'fecha',
  'hora',
  'grupo',
  'participantes',
  'objetivo',
  'novedades',
  'nombreCompleto',
  'correo',
  'celular',
  'sede',
  'nivel',
  'facultad',
  'programa',
  'semestre',
  'terminosAceptados',
];

/** El aviso con el primer campo que falta, en el orden del formulario (CA2); sin errores, null. */
function mensajeFaltantes(errores: FieldErrors<Valores>): string | null {
  if (Object.keys(errores).length === 0) return null;
  const mensaje = primerMensajeDeError(errores, ORDEN_CAMPOS);
  return mensaje ? `Revisa el formulario: ${mensaje}` : 'Revisa los campos marcados.';
}

type Props = {
  /** Solo las líneas activas: la pantalla las filtra. */
  lineas: LineaFormacion[];
  parametros: Parametros;
  usuario: Usuario;
  /** El perfil (HU-06), si cargó: su teléfono prellena el celular. */
  perfil?: Perfil;
};

export function FormularioSolicitudCapacitacion({ lineas, parametros, usuario, perfil }: Props) {
  const [hoy] = useState(hoyISO);
  const solicitud = useSolicitarCapacitacion();
  const [enviada, setEnviada] = useState(false);
  const [faltantes, setFaltantes] = useState<string | null>(null);
  const [pestana, setPestana] = useState<PestanaCapacitacion>('solicitud');
  // CA3: el día tachado que se tocó, con la fecha que tenía el campo en ese momento. Si el campo
  // cambia (Usar esta fecha u otro día), el aviso ya no aplica.
  const [tocado, setTocado] = useState<{ dia: string; fechaCampo: string } | null>(null);

  const { control, handleSubmit, setValue, trigger, getFieldState, subscribe, formState } =
    useForm<Valores>({
      // Al salir de un campo ya tocado se valida: los errores de un paso se corrigen al escribir.
      mode: 'onTouched',
      resolver: zodResolver(esquemaSolicitudCapacitacionCompleta(parametros)),
      defaultValues: {
        ...VALORES_INICIALES_CAPACITACION_COMPLETA,
        ...valoresSolicitante(datosSolicitanteDe(usuario, perfil)),
      },
    });
  const errores = formState.errors;
  // Una vez que hay errores a la vista, cada cambio vuelve a validar su campo.
  const validar = {
    shouldValidate: formState.isSubmitted || Object.keys(errores).length > 0,
  };
  const valoresDatos = useWatch({ control, name: CAMPOS_SOLICITANTE });
  const solicitante = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo, i) => [campo, valoresDatos[i] ?? '']),
  ) as ValoresSolicitante;
  const erroresDatos = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo) => [campo, errores[campo]?.message]).filter(([, m]) => m),
  ) as Partial<Record<CampoSolicitante, string>>;
  const terminosAceptados = useWatch({ control, name: 'terminosAceptados' });

  // Al editar, el aviso de arriba del botón sigue a los errores: pasa al siguiente que falte o
  // se quita cuando ya no hay. El error de la API también se quita, porque era de otros datos.
  const reiniciarEnvio = solicitud.reset;
  useEffect(
    () =>
      subscribe({
        formState: { errors: true, values: true },
        callback: ({ errors, type }) => {
          if (type === 'change') reiniciarEnvio();
          if (errors) setFaltantes((actual) => (actual == null ? null : mensajeFaltantes(errors)));
        },
      }),
    [subscribe, reiniciarEnvio],
  );
  const fecha = useWatch({ control, name: 'fecha' });
  const hora = useWatch({ control, name: 'hora' });

  // CA3 al tocar un día tachado: su motivo y la primera fecha que sí sirve. El campo también
  // puede traer un día no hábil (por ejemplo, si cambian los parámetros): se avisa igual.
  const diaTocado = tocado && tocado.fechaCampo === fecha ? tocado.dia : null;
  const diaNoHabil = esFechaValida(fecha) && !esDiaHabil(fecha, parametros);
  const diaRevisado = diaTocado ?? (diaNoHabil ? fecha : null);
  const sugeridaAlElegir = diaRevisado
    ? sugerirFechaHabil(
        diaRevisado < hoy ? hoy : diaRevisado,
        esHoraValida(hora) ? hora : HORA_REFERENCIA,
        parametros,
      )
    : undefined;
  // El motivo del día tocado va bajo el campo; el del campo ya lo pone la validación.
  const motivoTocado = diaTocado
    ? diaTocado < hoy
      ? 'Esa fecha ya pasó.'
      : mensajeDiaNoHabil(diaTocado, parametros)
    : null;
  // CA3 al enviar: la API trae su propia sugerencia (por ejemplo, por las 24 h).
  const sugeridaPorApi = fechaSugeridaDeError(solicitud.error);

  // La fecha se valida al elegirla, sin esperar a Enviar: así el motivo sale bajo el campo de
  // una vez (CA3) y no hace falta repetirlo junto a la sugerencia.
  useEffect(() => {
    if (esFechaValida(fecha)) trigger('fecha');
  }, [fecha, trigger]);

  const aviso = enviada ? CONFIRMACION : faltantes;
  const avisoFecha = diaRevisado
    ? `${motivoTocado ?? mensajeDiaNoHabil(diaRevisado, parametros)}${
        sugeridaAlElegir ? ` ¿Te sirve el ${fechaCompleta(sugeridaAlElegir).toLowerCase()}?` : ''
      }`
    : null;
  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);
  useEffect(() => {
    if (Platform.OS === 'ios' && avisoFecha) AccessibilityInfo.announceForAccessibility(avisoFecha);
  }, [avisoFecha]);

  const usarFecha = (sugerida: string) => {
    setValue('fecha', sugerida, { shouldValidate: true });
    setPestana('solicitud');
    solicitud.reset();
  };

  const enviar = (datos: Valores) => {
    setFaltantes(null);
    const novedades = datos.novedades.trim();
    const formulario: FormularioCapacitacion = {
      lineaId: datos.lineaId,
      modalidad: datos.modalidad as ModalidadCapacitacion,
      fecha: datos.fecha.trim(),
      hora: datos.hora.trim(),
      objetivo: datos.objetivo.trim(),
      // "Asignatura y grupo" (#251): un solo texto, el `group_or_subject` del Backend.
      grupo: datos.grupo.trim(),
      participantes: Number(datos.participantes),
      datosSolicitante: aDatosSolicitante(datos),
      ...(novedades ? { novedades } : {}),
      terminosAceptados: datos.terminosAceptados,
    };
    solicitud.mutate(formulario, { onSuccess: () => setEnviada(true) });
  };

  // Si al enviar algo falla por la validación (por ejemplo, la fecha dejó de servir), vuelve a ese
  // paso con el aviso.
  const alFaltarDatos = (conError: FieldErrors<Valores>) => {
    setFaltantes(mensajeFaltantes(conError) ?? 'Revisa los campos marcados.');
    const primero = primerPasoConError(conError, PESTANA_DE_CAMPO, ORDEN_PESTANAS);
    if (primero) setPestana(primero);
  };

  const indice = ORDEN_PESTANAS.indexOf(pestana);

  /** "Siguiente": valida solo los campos de este paso y, si están bien, avanza (CA2). */
  const avanzar = async () => {
    const campos = camposDelPaso(PESTANA_DE_CAMPO, pestana);
    if (await trigger(campos)) {
      setFaltantes(null);
      setPestana(ORDEN_PESTANAS[indice + 1]);
      return;
    }
    const mensaje = ORDEN_CAMPOS.filter((campo) => campos.includes(campo))
      .map((campo) => getFieldState(campo).error?.message)
      .find(Boolean);
    setFaltantes(mensaje ? `Revisa el formulario: ${mensaje}` : 'Revisa los campos marcados.');
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
            onPress={() => router.replace('/solicitudes')}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ver mis solicitudes"
          >
            Ver mis solicitudes
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
      pasos={PESTANAS}
      paso={pestana}
      onAnterior={() => {
        setFaltantes(null);
        setPestana(ORDEN_PESTANAS[indice - 1]);
      }}
      onSiguiente={() => void avanzar()}
      onEnviar={() => handleSubmit(enviar, alFaltarDatos)()}
      enviando={guardando}
      etiquetaEnviar="Enviar la solicitud de capacitación"
      puedeEnviar={terminosAceptados}
      avisos={
        <>
          {solicitud.error ? <AvisoError mensaje={mensajeErrorGuardar(solicitud.error)} /> : null}
          {sugeridaPorApi ? (
            <FechaSugerida
              titulo="Primera fecha disponible"
              sugerida={sugeridaPorApi}
              onUsar={usarFecha}
            />
          ) : null}
          {faltantes ? <AvisoError mensaje={faltantes} /> : null}
        </>
      }
    >
      {pestana === 'solicitud' ? (
        <View style={estilos.formulario}>
          <Seccion titulo="Capacitación">
            <Controller
              control={control}
              name="lineaId"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <View style={estilos.grupo}>
                  <Text variant="labelLarge" style={estilos.etiqueta}>
                    Línea de formación
                  </Text>
                  <View accessibilityRole="radiogroup" style={estilos.opciones}>
                    {lineas.map((linea) => (
                      <OpcionLinea
                        key={linea.id}
                        linea={linea}
                        elegida={value === linea.id}
                        deshabilitada={guardando}
                        onElegir={() => onChange(linea.id)}
                      />
                    ))}
                  </View>
                  <HelperText type="error" visible={error != null}>
                    {error?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="modalidad"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <View style={estilos.grupo}>
                  <Text variant="labelLarge" style={estilos.etiqueta}>
                    Modalidad
                  </Text>
                  <SegmentedButtons
                    value={value}
                    onValueChange={onChange}
                    buttons={MODALIDADES_CAPACITACION.map((opcion) => ({
                      value: opcion.valor,
                      label: opcion.etiqueta,
                      icon: opcion.icono,
                      disabled: guardando,
                      accessibilityLabel: `Modalidad ${opcion.etiqueta.toLowerCase()}`,
                    }))}
                  />
                  <HelperText type="error" visible={error != null}>
                    {error?.message}
                  </HelperText>
                </View>
              )}
            />
          </Seccion>

          <Seccion titulo="Fecha y hora">
            <CampoFormulario
              control={control}
              nombre="fecha"
              etiqueta="Fecha"
              tipo="fecha"
              // Tachados como en los demás calendarios; al tocar uno, se avisa abajo (CA3).
              motivoNoElegible={(dia) => motivoDiaCapacitacion(dia, parametros, hoy)}
              alTocarNoElegible={(dia) => {
                setTocado({ dia, fechaCampo: fecha });
                solicitud.reset();
              }}
              mesMinimo={hoy}
              mesMaximo={sumarMeses(hoy, MESES_CAPACITACION)}
              deshabilitado={guardando}
            />
            {motivoTocado ? (
              <HelperText type="error" visible accessibilityLiveRegion="polite">
                {motivoTocado}
              </HelperText>
            ) : null}
            {/* El motivo ya sale en rojo bajo el campo; aquí solo va la salida. */}
            {sugeridaAlElegir ? (
              <FechaSugerida
                titulo="¿Te sirve el próximo día con atención?"
                sugerida={sugeridaAlElegir}
                onUsar={usarFecha}
              />
            ) : null}
            <CampoFormulario
              control={control}
              nombre="hora"
              etiqueta="Hora"
              tipo="hora"
              deshabilitado={guardando}
            />
          </Seccion>

          <Seccion titulo="El grupo">
            <CampoFormulario
              control={control}
              nombre="grupo"
              etiqueta={`Asignatura y grupo (hasta ${LARGO_MAXIMO_GRUPO} caracteres)`}
              placeholder="Por ejemplo: Bases de datos, 7.º semestre, grupo 02"
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="participantes"
              etiqueta={`Participantes (de 1 a ${MAXIMO_PARTICIPANTES})`}
              tipo="numero"
              minimo={1}
              maximo={MAXIMO_PARTICIPANTES}
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="objetivo"
              etiqueta={`Objetivo (hasta ${LARGO_MAXIMO_OBJETIVO} caracteres)`}
              placeholder="Por ejemplo: aprender a citar en APA el trabajo de grado"
              multilinea
              deshabilitado={guardando}
            />
            <CampoFormulario
              control={control}
              nombre="novedades"
              etiqueta={`Novedades (opcional, hasta ${LARGO_MAXIMO_NOVEDADES} caracteres)`}
              placeholder="Lo que quieras que la biblioteca sepa antes de la capacitación"
              multilinea
              deshabilitado={guardando}
            />
          </Seccion>
        </View>
      ) : null}

      {pestana === 'datos' ? (
        <View style={estilos.seccion}>
          <Text variant="bodySmall" style={estilos.secundario}>
            Vienen de tu cuenta; corrige lo que haga falta.
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
        <SeccionTerminos
          texto={TERMINOS_FORMACION}
          aceptados={terminosAceptados}
          onCambiar={(acepta) => setValue('terminosAceptados', acepta, validar)}
          mensajeError={errores.terminosAceptados?.message}
          deshabilitado={guardando}
        />
      ) : null}
    </PasosFormulario>
  );
}

/** Una línea para elegir: nombre y descripción, con su radio (CA1). */
function OpcionLinea({
  linea,
  elegida,
  deshabilitada,
  onElegir,
}: {
  linea: LineaFormacion;
  elegida: boolean;
  deshabilitada: boolean;
  onElegir: () => void;
}) {
  return (
    <View style={[estilos.opcion, elegida ? estilos.opcionElegida : null]}>
      <TouchableRipple
        onPress={onElegir}
        disabled={deshabilitada}
        accessibilityRole="radio"
        accessibilityState={{ checked: elegida, disabled: deshabilitada }}
        accessibilityLabel={`${linea.nombre}. ${linea.descripcion}`}
      >
        <View style={estilos.contenidoOpcion}>
          {/* Solo dibuja el radio: la fila es la que se toca y se anuncia. */}
          <View
            style={estilos.soloDibujo}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <RadioButton.Android
              value={linea.id}
              status={elegida ? 'checked' : 'unchecked'}
              disabled={deshabilitada}
              color={colores.primario}
            />
          </View>
          <View style={estilos.textosOpcion}>
            <Text variant="bodyLarge" style={estilos.nombreLinea}>
              {linea.nombre}
            </Text>
            <Text variant="bodyMedium" style={estilos.secundario}>
              {linea.descripcion}
            </Text>
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
}

/**
 * La salida a una fecha que no sirve (CA3): va aparte del error y en verde suave, para que se
 * lea como la solución y no como otro problema. El motivo lo dice el error, no se repite aquí.
 */
function FechaSugerida({
  titulo,
  sugerida,
  onUsar,
}: {
  titulo: string;
  sugerida: string;
  onUsar: (fecha: string) => void;
}) {
  const texto = fechaCompleta(sugerida);

  return (
    <View style={estilos.sugerida} accessibilityLiveRegion="polite">
      <Text variant="labelMedium" style={estilos.tituloSugerida}>
        {titulo}
      </Text>
      <View style={estilos.fechaSugerida}>
        <Icon source="calendar-check-outline" size={20} color={colores.primario} />
        {/* La fecha va como texto aparte: la etiqueta de Button es de una sola línea. */}
        <Text variant="bodyLarge" style={estilos.textoSugerida}>
          {texto}
        </Text>
      </View>
      <Button
        mode="contained"
        onPress={() => onUsar(sugerida)}
        style={estilos.botonSugerida}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={`Usar el ${texto.toLowerCase()}`}
      >
        Usar esta fecha
      </Button>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.seccion}>
      <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  seccion: { gap: espacio.xs },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  grupo: { gap: espacio.xs },
  etiqueta: { color: colores.texto },
  opciones: { gap: espacio.s },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  opcion: {
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  opcionElegida: { backgroundColor: colores.primarioSuave },
  contenidoOpcion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.xs,
    paddingVertical: espacio.s,
    paddingRight: espacio.m,
  },
  soloDibujo: { pointerEvents: 'none' },
  textosOpcion: { flex: 1, gap: espacio.xs, paddingTop: espacio.xs },
  nombreLinea: { color: colores.texto, fontFamily: fuentes.seminegrita },
  secundario: { color: colores.textoSecundario },
  // Sobre primarioSuave, el texto va en colores.texto (contraste AA).
  sugerida: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  tituloSugerida: { color: colores.texto },
  fechaSugerida: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textoSugerida: { flex: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
  botonSugerida: { alignSelf: 'flex-end' },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  botones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
