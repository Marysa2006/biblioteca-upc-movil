/**
 * Reprogramar una asesoría (#249, CA4): como `reschedule/` del Backend, solo se eligen la fecha y
 * la hora nuevas; lo demás se copia de la solicitud anterior (solicitudReprogramada()).
 * Avisa antes de enviar que se manda una solicitud nueva y la anterior queda cancelada. Las reglas
 * de la fecha y la hora son las de la solicitud (problemaFechaHoraCita, CA2).
 * No consulta ni guarda: la pantalla le pasa los datos y envía con onEnviar.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';
import { AvisoError, CampoHora, Upecito } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita, Parametros } from '@/types';
import {
  esquemaReprogramarCita,
  horasInicioCita,
  motivoDiaNoElegibleCita,
  type ValoresReprogramarCita,
} from '@/utils/asesorias';
import { fechaCompleta, sumarDias } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';

/** Hasta cuántos días adelante se ofrece el calendario, como en la solicitud. */
const DIAS_CALENDARIO = 90;

const AVISO =
  'Enviaremos una nueva solicitud con esta fecha y cancelaremos la anterior. La nueva queda ' +
  'pendiente hasta que la biblioteca la apruebe.';

const CONFIRMACION =
  'Listo: tu nueva solicitud quedó pendiente y la anterior, cancelada. La biblioteca confirma ' +
  'la fecha y te avisa con una notificación.';

type Props = {
  cita: Cita;
  parametros: Parametros;
  guardando: boolean;
  /** Error de la API al enviar, con mensajeErrorGuardar(). */
  mensajeError: string | null;
  enviada: boolean;
  onEnviar: (fecha: string, hora: string) => void;
};

export function FormularioReprogramarCita({
  cita,
  parametros,
  guardando,
  mensajeError,
  enviada,
  onEnviar,
}: Props) {
  const hoy = hoyISO();
  const { control, handleSubmit, setValue, formState } = useForm<ValoresReprogramarCita>({
    resolver: zodResolver(esquemaReprogramarCita(parametros)),
    defaultValues: { fecha: '', hora: '' },
  });
  const errores = formState.errors;
  const validar = { shouldValidate: formState.isSubmitted };
  const [fecha, hora] = useWatch({ control, name: ['fecha', 'hora'] });
  const horario = fecha ? horasInicioCita(fecha, parametros) : null;
  const actual = `${fechaCompleta(cita.fecha)} a las ${cita.horaInicio}`;

  const enviar = handleSubmit(
    (datos) => onEnviar(datos.fecha, datos.hora),
    (conError) => {
      // En Android lo anuncia accessibilityLiveRegion bajo cada campo.
      const mensaje = conError.fecha?.message ?? conError.hora?.message;
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
          onPress={() => router.back()}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          Volver
        </Button>
      </View>
    );
  }

  return (
    <View style={estilos.formulario}>
      <View style={estilos.tarjeta}>
        <Text variant="labelMedium" style={estilos.secundario}>
          {cita.estado === 'pendiente' ? 'Fecha que pediste' : 'Fecha actual'}
        </Text>
        <Text variant="bodyLarge" style={estilos.dato}>
          {actual}
        </Text>
      </View>

      {/* Sobre el fondo de color, el texto va en colores.texto (contraste AA). */}
      <View style={estilos.aviso}>
        <Icon source="information-outline" size={20} color={colores.primarioOscuro} />
        <Text variant="bodyMedium" style={estilos.textoAviso}>
          {AVISO}
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <SelectorFecha
          etiqueta="Nueva fecha"
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
          {`Con al menos ${parametros.horasMinimasSolicitud} horas de anticipación.`}
        </Text>

        <CampoHora
          etiqueta="Nueva hora"
          valor={hora}
          onCambiar={(nueva) => setValue('hora', nueva, validar)}
          mensajeError={errores.hora?.message}
          deshabilitado={guardando}
        />
        <Text variant="bodySmall" style={estilos.secundario}>
          {horario
            ? `Ese día, entre las ${horario.desde} y las ${horario.hasta}.`
            : 'Dentro del horario de atención.'}
        </Text>
      </View>

      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      <Button
        mode="contained"
        onPress={() => enviar()}
        loading={guardando}
        disabled={guardando}
        contentStyle={estilos.contenidoBoton}
        labelStyle={estilos.textoBoton}
        accessibilityRole="button"
        accessibilityLabel={`Enviar la nueva fecha de la asesoría de ${cita.tema}`}
      >
        Enviar nueva fecha
      </Button>
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
  secundario: { color: colores.textoSecundario },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textoAviso: { flexShrink: 1, color: colores.texto },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { fontFamily: fuentes.seminegrita },
});
