/**
 * Solicitud de préstamo de tablet (HU-22 y #163): la fecha (hasta diasMaximosTablet días antes),
 * la hora de inicio (en punto o y media) con las tablets que quedan, cuántas horas (de 1 al
 * máximo; empieza en horasPrestamoTablet) con la hora de devolución, los datos de quien la pide
 * (#224; desde el #294, con SeccionDatosSolicitante, como las demás solicitudes), las condiciones
 * de uso, la responsabilidad y Confirmar. Se usa con la sesión iniciada: sin sesión, la pantalla
 * solo muestra la invitación a iniciarla.
 * - CA2: al tocar una franja sin tablets, o si al confirmar la API dice que no hay una tablet
 *   libre todas las horas, se sugieren otras franjas; si el día no tiene ninguna, las
 *   sugerencias del día de la API. Una sugerencia de otro día cambia la fecha y deja elegida la
 *   franja con su duración.
 * - CA3: sin aceptar las condiciones y la responsabilidad, no se envía y se explica bajo cada
 *   casilla.
 * - CA4: no se pueden pedir más horas que `horasMaximasPrestamo` ni pasar del cierre.
 * - CA1: al terminar, la confirmación en el mismo lugar, como en HU-18.
 * No consulta ni guarda: la pantalla pide las franjas con la fecha y envía con onConfirmar. La
 * hora límite la vuelve a calcular la API.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import {
  SeccionDatosSolicitante,
  type CampoSolicitante,
} from '@/components/solicitudes/SeccionDatosSolicitante';
import { AvisoError, CampoNumerico, EstadoCarga, EstadoError, Upecito } from '@/components/ui';
import type { AlternativaPrestamo, FormularioPrestamo, FranjaTablets } from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { CondicionesTablet, Parametros, Perfil, Usuario } from '@/types';
import { fechaCompleta } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { aMinutos } from '@/utils/franjas';
import {
  aDatosSolicitante,
  datosSolicitanteDe,
  valoresSolicitante,
  type ValoresSolicitante,
} from '@/utils/solicitante';
import {
  esquemaPrestamo,
  franjasSugeridas,
  horaLimiteDe,
  horasPorDefecto,
  horasPosibles,
  motivoDiaNoElegible,
  ultimoDiaTablet,
  type DatosPrestamo,
} from '@/utils/tablets';

import { CondicionesUso } from './CondicionesUso';
import { ListaFranjasTablet } from './ListaFranjasTablet';
import { ResponsabilidadPrestamo } from './ResponsabilidadPrestamo';
import { SugerenciasFranja } from './SugerenciasFranja';

const CONFIRMACION =
  'Solicitud enviada. Tu tablet quedó reservada: recógela en el mostrador a la hora de inicio ' +
  'y devuélvela a la hora límite. Te dejamos una notificación con los datos.';

/** Orden de los campos para anunciar el primer error en iOS. */
const CAMPOS: (keyof DatosPrestamo)[] = [
  'tipo',
  'horaInicio',
  'horas',
  'nombreCompleto',
  'identificacion',
  'correo',
  'celular',
  'sede',
  'nivel',
  'facultad',
  'programa',
  'semestre',
  'aceptaCondiciones',
  'responsabilidadAceptada',
];

/** Los datos de quien la pide, los mismos de las demás solicitudes (#294). */
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

type Props = {
  parametros: Parametros;
  condiciones: CondicionesTablet;
  /** Quien pide la tablet: decide qué datos se piden y prellena el formulario. */
  usuario: Usuario;
  /** El perfil (HU-06), si cargó: su teléfono prellena el celular. */
  perfil?: Perfil;
  /** La fecha la lleva la pantalla, porque con ella pide las franjas. */
  fecha: string;
  onCambiarFecha: (fecha: string) => void;
  /** Las franjas de la fecha; undefined mientras cargan. */
  franjas: FranjaTablets[] | undefined;
  /** Si el día no es hábil, por qué (DiaTablets.motivo). */
  motivoDia?: string;
  /** Lo que sugiere la API cuando el día no tiene ninguna franja disponible (CA2). */
  sugerenciasDia: AlternativaPrestamo[];
  errorFranjas: boolean;
  onReintentarFranjas: () => void;
  guardando: boolean;
  /** Error de la API al confirmar, con mensajeErrorGuardar(). */
  mensajeError: string | null;
  /** Franjas sugeridas por el 400 de la API cuando no hubo tablet libre todas las horas (CA2). */
  sugeridasError: AlternativaPrestamo[];
  /** El mensaje de ese 400, por ejemplo «No hay una tablet libre de 10:00 a 13:00.». */
  mensajeSugeridas?: string;
  /** Se cambió la franja o las horas: la pantalla limpia el error de la solicitud anterior. */
  onLimpiarError: () => void;
  /** La solicitud ya se registró (CA1). */
  enviada: boolean;
  onConfirmar: (solicitud: FormularioPrestamo) => void;
};

export function FormularioPrestamoTablet({
  parametros,
  condiciones,
  usuario,
  perfil,
  fecha,
  onCambiarFecha,
  franjas,
  motivoDia,
  sugerenciasDia,
  errorFranjas,
  onReintentarFranjas,
  guardando,
  mensajeError,
  sugeridasError,
  mensajeSugeridas,
  onLimpiarError,
  enviada,
  onConfirmar,
}: Props) {
  const hoy = hoyISO();
  const maximoHoras = parametros.horasMaximasPrestamo;
  const { control, handleSubmit, setValue, formState } = useForm<DatosPrestamo>({
    resolver: zodResolver(esquemaPrestamo({ maximoHoras })),
    defaultValues: {
      ...valoresSolicitante(datosSolicitanteDe(usuario, perfil)),
      horaInicio: '',
      horas: String(horasPorDefecto(parametros)),
      aceptaCondiciones: false,
      responsabilidadAceptada: false,
    },
  });
  const horaInicio = useWatch({ control, name: 'horaInicio' });
  const horas = useWatch({ control, name: 'horas' });
  const aceptaCondiciones = useWatch({ control, name: 'aceptaCondiciones' });
  const responsabilidadAceptada = useWatch({ control, name: 'responsabilidadAceptada' });
  const valoresDatos = useWatch({ control, name: CAMPOS_SOLICITANTE });
  /** La franja sin tablets que se tocó (CA2). */
  const [consultada, setConsultada] = useState<FranjaTablets | null>(null);

  const validar = { shouldValidate: formState.isSubmitted };
  const errores = formState.errors;
  const solicitante = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo, i) => [campo, valoresDatos[i] ?? '']),
  ) as ValoresSolicitante;
  const erroresDatos = Object.fromEntries(
    CAMPOS_SOLICITANTE.map((campo) => [campo, errores[campo]?.message]).filter(([, m]) => m),
  ) as Partial<Record<CampoSolicitante, string>>;
  // CA4: desde la franja elegida, hasta el máximo y sin pasar del cierre.
  const maximoDesdeInicio =
    franjas && horaInicio ? horasPosibles(franjas, horaInicio, maximoHoras) : maximoHoras;
  const horasNumero = Number(horas);
  const horasValidas =
    horas !== '' && Number.isInteger(horasNumero) && horasNumero >= 1 && horasNumero <= maximoHoras;
  const devolucion = horaInicio && horasValidas ? horaLimiteDe(horaInicio, horasNumero) : null;
  const textoMaximo = `${maximoDesdeInicio} ${maximoDesdeInicio === 1 ? 'hora' : 'horas'}`;
  const ayudaHoras =
    maximoDesdeInicio < maximoHoras
      ? `Desde las ${horaInicio}, hasta ${textoMaximo}: luego cierra la biblioteca.`
      : `Puedes pedirla de 1 a ${maximoHoras} horas.`;

  // Si la nueva franja deja menos horas antes del cierre, se ajustan las horas pedidas.
  useEffect(() => {
    if (maximoDesdeInicio > 0 && Number(horas) > maximoDesdeInicio) {
      setValue('horas', String(maximoDesdeInicio));
    }
  }, [maximoDesdeInicio, horas, setValue]);

  const elegirHora = (hora: string) => {
    setValue('horaInicio', hora, validar);
    setConsultada(null);
    onLimpiarError();
  };

  const cambiarHoras = (valor: string) => {
    setValue('horas', valor, validar);
    onLimpiarError();
  };

  const cambiarFecha = (nueva: string) => {
    setValue('horaInicio', '');
    setConsultada(null);
    onLimpiarError();
    onCambiarFecha(nueva);
  };

  // Una sugerencia de otro día cambia la fecha; queda elegida su franja con su duración.
  const elegirSugerida = (sugerida: AlternativaPrestamo) => {
    if (sugerida.fecha !== fecha) cambiarFecha(sugerida.fecha);
    elegirHora(sugerida.horaInicio);
    const duracion = (aMinutos(sugerida.horaLimite) - aMinutos(sugerida.horaInicio)) / 60;
    if (duracion >= 1) setValue('horas', String(duracion), validar);
  };

  const confirmar = handleSubmit(
    (datos) => {
      onConfirmar({
        fecha,
        horaInicio: datos.horaInicio,
        horas: Number(datos.horas),
        aceptaCondiciones: datos.aceptaCondiciones,
        responsabilidadAceptada: datos.responsabilidadAceptada,
        datosSolicitante: aDatosSolicitante(datos),
      });
    },
    (conError) => {
      // En Android lo anuncia accessibilityLiveRegion bajo cada campo.
      const primero = CAMPOS.find((campo) => conError[campo] != null);
      const mensaje = primero ? conError[primero]?.message : undefined;
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

  const conTablets = franjas?.some((franja) => franja.estado === 'disponible') ?? false;

  // CA2: la que no tuvo tablet todas las horas al confirmar, la que se tocó sin tablets o el día
  // sin tablets.
  let sugerencias = null;
  if (franjas && sugeridasError.length > 0) {
    sugerencias = (
      <SugerenciasFranja
        // SugerenciasFranja agrega «. Prueba con:».
        mensaje={(mensajeSugeridas ?? 'No hay una tablet libre en ese horario').replace(/\.$/, '')}
        sugeridas={sugeridasError}
        fecha={fecha}
        onElegir={elegirSugerida}
      />
    );
  } else if (franjas && consultada) {
    const delDia = franjasSugeridas(franjas, consultada.horaInicio, fecha);
    sugerencias = (
      <SugerenciasFranja
        mensaje={`No quedan tablets de ${consultada.horaInicio} a ${consultada.horaFin}`}
        sugeridas={delDia.length > 0 ? delDia : sugerenciasDia}
        fecha={fecha}
        onElegir={elegirSugerida}
      />
    );
  } else if (franjas && !conTablets) {
    let mensaje = 'No quedan tablets este día';
    if (motivoDia) mensaje = `Ese día no hay préstamo de tablets: ${motivoDia}`;
    else if (franjas.length === 0) mensaje = 'No hay franjas de préstamo este día';
    sugerencias = (
      <SugerenciasFranja
        mensaje={mensaje}
        sugeridas={sugerenciasDia}
        fecha={fecha}
        onElegir={elegirSugerida}
      />
    );
  }

  let listaFranjas;
  if (!fecha) {
    listaFranjas = null;
  } else if (errorFranjas) {
    listaFranjas = (
      <EstadoError mensaje="No pudimos consultar las tablets de ese día." onReintentar={onReintentarFranjas} />
    );
  } else if (!franjas) {
    listaFranjas = <EstadoCarga mensaje="Consultando las tablets…" />;
  } else {
    listaFranjas = (
      <>
        {franjas.length > 0 ? (
          <ListaFranjasTablet
            franjas={franjas}
            elegida={horaInicio}
            onElegir={(franja) => elegirHora(franja.horaInicio)}
            onConsultarAgotada={setConsultada}
          />
        ) : null}
        {sugerencias}
        {errores.horaInicio ? <AvisoError mensaje={errores.horaInicio.message ?? ''} /> : null}
      </>
    );
  }

  return (
    <View style={estilos.formulario}>
      <SelectorFecha
        etiqueta="Fecha"
        valor={fecha}
        onCambiar={cambiarFecha}
        motivoNoElegible={(dia) => motivoDiaNoElegible(dia, parametros, hoy)}
        mesMinimo={hoy}
        mesMaximo={ultimoDiaTablet(parametros, hoy)}
        descripcion={fecha ? fechaCompleta(fecha) : undefined}
        deshabilitado={guardando}
      />
      <Text variant="bodySmall" style={estilos.secundario}>
        {`Puedes apartarla con hasta ${parametros.diasMaximosTablet} días de anticipación.`}
      </Text>

      {fecha ? (
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Hora de inicio
        </Text>
      ) : null}
      {listaFranjas}

      {horaInicio && franjas ? (
        <View style={estilos.tarjeta}>
          <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
            ¿Por cuántas horas?
          </Text>
          <CampoNumerico
            etiqueta="Horas"
            valor={horas}
            onCambiar={cambiarHoras}
            minimo={1}
            maximo={maximoDesdeInicio}
            mensajeError={errores.horas?.message}
            deshabilitado={guardando}
          />
          <Text variant="bodySmall" style={estilos.secundario}>
            {ayudaHoras}
          </Text>
          {devolucion ? (
            <View accessibilityLiveRegion="polite" style={estilos.horario}>
              <Text variant="bodyLarge" style={estilos.dato}>
                {`Inicio: ${horaInicio}`}
              </Text>
              <Text variant="bodyLarge" style={estilos.dato}>
                {`Devolución: ${devolucion}`}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={estilos.tarjeta}>
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Tus datos
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          Vienen de tu cuenta; corrige lo que haga falta.
        </Text>
        <SeccionDatosSolicitante
          valores={solicitante}
          onCambiar={(campo, valor) => setValue(campo, valor, validar)}
          errores={erroresDatos}
          pedirIdentificacion={!usuario.identificacion}
          deshabilitado={guardando}
        />
      </View>

      <CondicionesUso
        condiciones={condiciones}
        aceptadas={aceptaCondiciones}
        onCambiar={(acepta) => setValue('aceptaCondiciones', acepta, validar)}
        mensajeError={errores.aceptaCondiciones?.message}
        deshabilitado={guardando}
      />

      <ResponsabilidadPrestamo
        aceptada={responsabilidadAceptada}
        onCambiar={(acepta) => setValue('responsabilidadAceptada', acepta, validar)}
        mensajeError={errores.responsabilidadAceptada?.message}
        deshabilitado={guardando}
      />

      {mensajeError && sugeridasError.length === 0 ? <AvisoError mensaje={mensajeError} /> : null}

      <Button
        mode="contained"
        onPress={() => confirmar()}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.textoBoton}
        accessibilityRole="button"
        accessibilityLabel="Confirmar la solicitud de préstamo de tablet"
      >
        Confirmar solicitud
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  subtitulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  secundario: { color: colores.textoSecundario },
  horario: { gap: espacio.xs },
  dato: { color: colores.primario, fontFamily: fuentes.seminegrita },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
