/**
 * Registrar la asistencia a una asesoría con el QR del facilitador (HU-32, función plus).
 * Va en la tarjeta de Mis citas y en el detalle de la asesoría de Mis solicitudes.
 * - Solo aparece mientras se puede tomar la asistencia (puedeTomarAsistencia: la cita está
 *   aprobada y es de hoy, desde 30 minutos antes de empezar).
 * - Si la persona ya se registró, en lugar del botón dice "Ya registraste tu asistencia" (CA3).
 * Abre la pantalla del escáner, /asistencia/registrar.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { useAsistencia } from '@/hooks/useAsistencia';
import { usaApi } from '@/api/cliente';
import { useSesion } from '@/store/sesion';
import { coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import { puedeTomarAsistencia } from '@/utils/asistencia';

export function BotonRegistrarAsistencia({ cita }: { cita: Cita }) {
  const conApi = usaApi('asistencia');
  const enCurso = conApi ? cita.estado === 'aprobada' : puedeTomarAsistencia(cita);
  // Solo se consulta la asistencia de las citas de hoy que la admiten.
  const asistencia = useAsistencia(enCurso && !conApi ? cita.id : '');
  const usuario = useSesion((estado) => estado.usuario);

  if (!enCurso || !usuario) return null;

  const registrada = asistencia.data?.registros.some(
    (registro) => registro.usuarioId === usuario.id,
  );

  if (registrada) {
    return (
      <View style={estilos.registrada}>
        <Icon source="check-circle-outline" size={20} color={coloresEstado.aprobada.texto} />
        <Text variant="bodyMedium" style={estilos.textoRegistrada}>
          Ya registraste tu asistencia.
        </Text>
      </View>
    );
  }

  return (
    <Button
      mode="contained"
      icon="qrcode-scan"
      onPress={() =>
        router.push({ pathname: '/asistencia/registrar', params: { citaId: cita.id } })
      }
      contentStyle={estilos.contenidoBoton}
      accessibilityRole="button"
      accessibilityLabel={`Registrar tu asistencia a la asesoría de ${cita.tema} con el código QR`}
    >
      Registrar asistencia
    </Button>
  );
}

const estilos = StyleSheet.create({
  // Sobre el fondo de color, el texto va en el tono del estado (contraste AA).
  registrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.aprobada.fondo,
  },
  textoRegistrada: {
    flex: 1,
    color: coloresEstado.aprobada.texto,
    fontFamily: fuentes.seminegrita,
  },
  contenidoBoton: { paddingVertical: espacio.xs },
});
