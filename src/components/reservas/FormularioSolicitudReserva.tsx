/**
 * Formulario de la comunidad para solicitar un espacio (HU-18).
 * - La fecha y la hora de inicio llegan del calendario (HU-17); la de fin empieza una hora después.
 * - CA3: valida antes de enviar la capacidad del espacio (y el día hábil y el horario) con
 *   esquemaSolicitudReserva; la API vuelve a validar.
 * - CA2: si el horario está ocupado, muestra los horarios libres que sugiere la API; al tocar
 *   uno, se pone en el formulario y la persona lo envía.
 * - CA1: al registrarse, el formulario cambia a una confirmación.
 * El solicitante sale de la sesión: el formulario no lo pide.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, TouchableRipple } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import {
  alternativasDeError,
  useSolicitarReserva,
  type AlternativaReserva,
} from '@/hooks/useReservas';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Espacio, Parametros } from '@/types';
import { fechaCompleta, sumarMeses } from '@/utils/calendario';
import { mensajeErrorGuardar } from '@/utils/errores';
import { esFechaValida, esHoraValida, hoyISO, sumarHoras } from '@/utils/fechas';
import {
  esquemaSolicitudReserva,
  MESES_RESERVA,
  motivoDiaReserva,
  type FormularioSolicitud,
} from '@/utils/reservas';

import { CampoFormulario } from './CampoFormulario';

const CONFIRMACION =
  'Solicitud enviada. Quedó pendiente de aprobación y te avisaremos cuando la revisen.';

type Props = {
  espacio: Espacio;
  parametros: Parametros;
  /** Fecha ('AAAA-MM-DD') y hora de inicio ('HH:MM') que vienen del calendario. */
  fecha?: string;
  hora?: string;
};

/** "Martes 21 de octubre · 10:00 – 12:00". */
const describir = ({ fecha, horaInicio, horaFin }: AlternativaReserva) =>
  `${fechaCompleta(fecha)} · ${horaInicio} – ${horaFin}`;

export function FormularioSolicitudReserva({ espacio: lugar, parametros, fecha, hora }: Props) {
  const [hoy] = useState(hoyISO);
  const solicitud = useSolicitarReserva();
  const alternativas = alternativasDeError(solicitud.error);
  const [enviada, setEnviada] = useState(false);
  const [elegida, setElegida] = useState<AlternativaReserva | null>(null);

  const horaValida = hora && esHoraValida(hora) ? hora : '';
  const { control, handleSubmit, setValue } = useForm<FormularioSolicitud>({
    resolver: zodResolver(esquemaSolicitudReserva({ parametros, espacio: lugar, hoy })),
    defaultValues: {
      fecha: fecha && esFechaValida(fecha) ? fecha : '',
      horaInicio: horaValida,
      horaFin: horaValida ? sumarHoras(horaValida, 1) : '',
      proposito: '',
      asistentes: '',
      requerimientos: '',
    },
  });

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

  const enviar = (datos: FormularioSolicitud) => {
    setElegida(null);
    solicitud.mutate(
      {
        espacioId: lugar.id,
        fecha: datos.fecha.trim(),
        horaInicio: datos.horaInicio.trim(),
        horaFin: datos.horaFin.trim(),
        proposito: datos.proposito.trim(),
        asistentes: Number(datos.asistentes),
        requerimientos: datos.requerimientos.trim() || undefined,
      },
      { onSuccess: () => setEnviada(true) },
    );
  };

  const elegirAlternativa = (alternativa: AlternativaReserva) => {
    const opciones = { shouldValidate: true };
    setValue('fecha', alternativa.fecha, opciones);
    setValue('horaInicio', alternativa.horaInicio, opciones);
    setValue('horaFin', alternativa.horaFin, opciones);
    solicitud.reset();
    setElegida(alternativa);
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
    <View style={estilos.formulario}>
      <Seccion titulo="Fecha y horario">
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
      </Seccion>

      {elegida ? (
        <View style={estilos.elegida} accessibilityLiveRegion="polite">
          <Icon source="information-outline" size={20} color={colores.primario} />
          <Text variant="bodyMedium" style={estilos.textoElegida}>
            {avisoElegida}
          </Text>
        </View>
      ) : null}

      <Seccion titulo="Detalles">
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
        <CampoFormulario
          control={control}
          nombre="requerimientos"
          etiqueta="Requerimientos (opcional)"
          placeholder="Por ejemplo: videobeam"
          multilinea
          deshabilitado={guardando}
        />
      </Seccion>

      {solicitud.error ? (
        <View style={estilos.error}>
          <AvisoError mensaje={mensajeErrorGuardar(solicitud.error)} />
          {alternativas.length > 0 ? (
            <View style={estilos.alternativas}>
              <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
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

      <Button
        mode="contained"
        onPress={() => handleSubmit(enviar)()}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={`Solicitar la reserva de ${lugar.nombre}`}
      >
        Solicitar reserva
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
  alternativa: { borderRadius: radio.boton, backgroundColor: colores.superficie, overflow: 'hidden' },
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
