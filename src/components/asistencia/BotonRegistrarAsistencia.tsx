/** Acceso al escáner desde una solicitud aprobada de hoy. */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { useAsistencia } from '@/hooks/useAsistencia';
import { usaApi } from '@/api/cliente';
import { useSesion } from '@/store/sesion';
import { coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { ResumenSolicitud } from '@/types';
import { esSesionAprobadaDeHoy } from '@/utils/asistencia';

type Props = {
  sesion: Pick<ResumenSolicitud, 'id' | 'fecha' | 'estado'>;
  tipo: 'cita' | 'capacitacion';
};

export function BotonRegistrarAsistencia({ sesion, tipo }: Props) {
  const conApi = usaApi('asistencia');
  const usuario = useSesion((estado) => estado.usuario);
  const enCurso = esSesionAprobadaDeHoy(sesion);
  const asistencia = useAsistencia(usuario && enCurso && !conApi ? sesion.id : '');

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
        router.push({ pathname: '/asistencia/registrar', params: { sesionId: sesion.id, tipo } })
      }
      contentStyle={estilos.contenidoBoton}
      accessibilityRole="button"
      accessibilityLabel="Registrar asistencia con QR"
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
  contenidoBoton: { minHeight: 44 },
});
