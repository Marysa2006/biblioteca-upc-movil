/**
 * Formulario de la comunidad para solicitar una capacitación (HU-10).
 * - CA2: valida antes de enviar con esquemaSolicitudCapacitacion; cada error va bajo su campo y,
 *   si falta algo, un aviso arriba del botón lo anuncia. La API vuelve a validar.
 * - CA3: el calendario solo bloquea los días pasados. Si se elige un día no hábil, el motivo sale
 *   en rojo bajo el campo y, aparte y en verde, la fecha sugerida (sugerirFechaHabil) con
 *   "Usar esta fecha". Si la API rechaza la fecha al enviar (por ejemplo, menos de 24 h), su
 *   mensaje sale en rojo y la misma sugerencia va debajo, fuera del aviso.
 * - CA1: al registrarse, el formulario cambia a una confirmación.
 * El solicitante sale de la sesión: el formulario no lo pide.
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
import { AvisoError } from '@/components/ui';
import {
  fechaSugeridaDeError,
  useSolicitarCapacitacion,
  type FormularioCapacitacion,
} from '@/hooks/useCapacitaciones';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { LineaFormacion, ModalidadCapacitacion, Parametros } from '@/types';
import { fechaCompleta, sumarMeses } from '@/utils/calendario';
import {
  esquemaSolicitudCapacitacion,
  LARGO_MAXIMO_GRUPO,
  mensajeDiaNoHabil,
  LARGO_MAXIMO_OBJETIVO,
  MAXIMO_PARTICIPANTES,
  MESES_CAPACITACION,
  MODALIDADES_CAPACITACION,
  VALORES_INICIALES_CAPACITACION,
  type ValoresSolicitudCapacitacion,
} from '@/utils/capacitaciones';
import { mensajeErrorGuardar } from '@/utils/errores';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { esDiaHabil, sugerirFechaHabil } from '@/utils/parametros';

const CONFIRMACION =
  'Solicitud enviada. Quedó pendiente y te avisaremos cuando la biblioteca la revise.';

/** Hora con la que se busca la fecha sugerida mientras la persona no elige una. */
const HORA_REFERENCIA = '12:00';

/** Orden de los campos, para anunciar el primero que falta (CA2). */
const ORDEN_CAMPOS: (keyof ValoresSolicitudCapacitacion)[] = [
  'lineaId',
  'modalidad',
  'fecha',
  'hora',
  'objetivo',
  'grupo',
  'participantes',
];

type Props = {
  /** Solo las líneas activas: la pantalla las filtra. */
  lineas: LineaFormacion[];
  parametros: Parametros;
};

export function FormularioSolicitudCapacitacion({ lineas, parametros }: Props) {
  const [hoy] = useState(hoyISO);
  const solicitud = useSolicitarCapacitacion();
  const [enviada, setEnviada] = useState(false);
  const [faltantes, setFaltantes] = useState<string | null>(null);

  const { control, handleSubmit, setValue, trigger } = useForm<ValoresSolicitudCapacitacion>({
    resolver: zodResolver(esquemaSolicitudCapacitacion(parametros)),
    defaultValues: VALORES_INICIALES_CAPACITACION,
  });
  const fecha = useWatch({ control, name: 'fecha' });
  const hora = useWatch({ control, name: 'hora' });

  // CA3 al elegir: si el día no es hábil, su motivo y la primera fecha que sí sirve.
  const diaNoHabil = esFechaValida(fecha) && !esDiaHabil(fecha, parametros);
  const sugeridaAlElegir = diaNoHabil
    ? sugerirFechaHabil(fecha, esHoraValida(hora) ? hora : HORA_REFERENCIA, parametros)
    : undefined;
  // CA3 al enviar: la API trae su propia sugerencia (por ejemplo, por las 24 h).
  const sugeridaPorApi = fechaSugeridaDeError(solicitud.error);

  // La fecha se valida al elegirla, sin esperar a Enviar: así el motivo sale bajo el campo de
  // una vez (CA3) y no hace falta repetirlo junto a la sugerencia.
  useEffect(() => {
    if (esFechaValida(fecha)) trigger('fecha');
  }, [fecha, trigger]);

  const aviso = enviada ? CONFIRMACION : faltantes;
  const avisoFecha = diaNoHabil
    ? `${mensajeDiaNoHabil(fecha, parametros)}${
        sugeridaAlElegir ? ` Próximo día con atención: ${fechaCompleta(sugeridaAlElegir)}.` : ''
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
    solicitud.reset();
  };

  const enviar = (datos: ValoresSolicitudCapacitacion) => {
    setFaltantes(null);
    const formulario: FormularioCapacitacion = {
      lineaId: datos.lineaId,
      modalidad: datos.modalidad as ModalidadCapacitacion,
      fecha: datos.fecha.trim(),
      hora: datos.hora.trim(),
      objetivo: datos.objetivo.trim(),
      grupo: datos.grupo.trim(),
      participantes: Number(datos.participantes),
    };
    solicitud.mutate(formulario, { onSuccess: () => setEnviada(true) });
  };

  const alFaltarDatos = (errores: FieldErrors<ValoresSolicitudCapacitacion>) => {
    const primero = ORDEN_CAMPOS.find((campo) => errores[campo]);
    const mensaje = primero ? errores[primero]?.message : undefined;
    setFaltantes(mensaje ? `Revisa el formulario: ${mensaje}` : 'Revisa los campos marcados.');
  };

  if (enviada) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Icon source="check-circle-outline" size={40} color={colores.primario} />
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
          // Solo los días pasados no se eligen: un día no hábil se avisa abajo (CA3).
          motivoNoElegible={(dia) => (dia < hoy ? 'ya pasó' : null)}
          mesMinimo={hoy}
          mesMaximo={sumarMeses(hoy, MESES_CAPACITACION)}
          deshabilitado={guardando}
        />
        {/* El motivo ya sale en rojo bajo el campo; aquí solo va la salida. */}
        {sugeridaAlElegir ? (
          <FechaSugerida
            titulo="Próximo día con atención"
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

      <Seccion titulo="Grupo">
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
          nombre="grupo"
          etiqueta={`Grupo (hasta ${LARGO_MAXIMO_GRUPO} caracteres)`}
          placeholder="Programa, curso o dependencia"
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
      </Seccion>

      {solicitud.error ? <AvisoError mensaje={mensajeErrorGuardar(solicitud.error)} /> : null}
      {sugeridaPorApi ? (
        <FechaSugerida
          titulo="Primera fecha disponible"
          sugerida={sugeridaPorApi}
          onUsar={usarFecha}
        />
      ) : null}

      {faltantes ? <AvisoError mensaje={faltantes} /> : null}

      <Button
        mode="contained"
        icon="send-outline"
        onPress={() => handleSubmit(enviar, alFaltarDatos)()}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Enviar la solicitud de capacitación"
      >
        Enviar solicitud
      </Button>
    </View>
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
