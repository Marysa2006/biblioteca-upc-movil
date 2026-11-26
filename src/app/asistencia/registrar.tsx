/** Escáner de asistencia de la comunidad (HU-32), desde Inicio o una solicitud. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { EscanerCodigos, type LecturaCodigo } from '@/components/camara/EscanerCodigos';
import { usaApi } from '@/api/cliente';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import {
  AvisoError,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
  Upecito,
} from '@/components/ui';
import { useMisSolicitudes } from '@/hooks/useSolicitudes';
import { useAsistencia, useRegistrarAsistenciaQr } from '@/hooks/useAsistencia';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { ResumenSolicitud } from '@/types';
import { esSolicitudConAsistenciaHoy, leerCodigoAsistencia } from '@/utils/asistencia';
import { fechaCompleta } from '@/utils/calendario';
import { mensajeErrorGuardar } from '@/utils/errores';

const NO_ES_QR_ASISTENCIA =
  'Ese código no es de una asistencia de la biblioteca. Escanea el QR que te muestra el facilitador.';
const QR_DE_OTRA_SESION =
  'Ese código es de otra sesión. Escanea el QR de tu sesión, el que te muestra el facilitador.';

export default function RegistrarAsistencia() {
  const usuario = useSesion((estado) => estado.usuario);

  return (
    <>
      <EncabezadoApilado titulo="Registrar asistencia" />
      <Pantalla titulo="Registrar asistencia" conEncabezado>
        {usuario ? (
          <Contenido />
        ) : (
          <InvitarSesion
            mensaje="Inicia sesión con tu cuenta institucional para registrar tu asistencia."
            etiqueta="Iniciar sesión para registrar mi asistencia"
          />
        )}
      </Pantalla>
    </>
  );
}

function Contenido() {
  const { sesionId, tipo, citaId } = useLocalSearchParams<{
    sesionId?: string;
    tipo?: string;
    citaId?: string;
  }>();
  const solicitudes = useMisSolicitudes();

  if (solicitudes.isPending) return <EstadoCarga mensaje="Cargando tus solicitudes…" />;
  if (solicitudes.isError && !solicitudes.data) {
    return (
      <EstadoError
        mensaje="No pudimos cargar tus solicitudes."
        onReintentar={() => solicitudes.refetch()}
      />
    );
  }
  const id = sesionId ?? citaId;
  const tipoPedido = citaId ? 'cita' : tipo;
  const sesiones = (solicitudes.data ?? []).filter(
    (solicitud) =>
      esSolicitudConAsistenciaHoy(solicitud) &&
      (!id || (solicitud.id === id && solicitud.tipo === tipoPedido)),
  );
  if (!sesiones.length) {
    return (
      <EstadoVacio mensaje="La asistencia se registra el día de una asesoría o capacitación aprobada." />
    );
  }
  return <Escaneo sesiones={sesiones} sesion={id ? sesiones[0] : undefined} />;
}

function Escaneo({
  sesiones,
  sesion,
}: {
  sesiones: ResumenSolicitud[];
  sesion?: ResumenSolicitud;
}) {
  const conApi = usaApi('asistencia');
  const usuario = useSesion((estado) => estado.usuario);
  const asistencia = useAsistencia(!conApi ? (sesion?.id ?? '') : '');
  const registrar = useRegistrarAsistenciaQr();
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [recienRegistrada, setRecienRegistrada] = useState(false);

  const yaRegistrada =
    registrar.data?.yaRegistrada ??
    asistencia.data?.registros.some((registro) => registro.usuarioId === usuario?.id) ??
    false;
  const confirmacion = yaRegistrada
    ? 'Tu asistencia a esta sesión ya estaba registrada.'
    : 'Tu asistencia quedó registrada.';

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  const anuncio = yaRegistrada || recienRegistrada ? confirmacion : rechazo;
  useEffect(() => {
    if (Platform.OS === 'ios' && anuncio) AccessibilityInfo.announceForAccessibility(anuncio);
  }, [anuncio]);

  const leido = ({ datos }: LecturaCodigo) => {
    if (registrar.isPending || yaRegistrada || recienRegistrada) return;
    setRechazo(null);
    if (!conApi) {
      const qr = leerCodigoAsistencia(datos);
      if (!qr) {
        setRechazo(NO_ES_QR_ASISTENCIA);
        return;
      }
      if (!sesiones.some((actual) => actual.id === qr.sesionId)) {
        setRechazo(QR_DE_OTRA_SESION);
        return;
      }
    }
    registrar.mutate(datos, {
      onSuccess: () => setRecienRegistrada(true),
      onError: (error) => setRechazo(mensajeErrorGuardar(error)),
    });
  };

  const resumen = sesion ? (
    <View style={estilos.resumen}>
      <Text variant="labelMedium" style={estilos.etiqueta}>
        {sesion.tipo === 'cita' ? 'Asesoría' : 'Capacitación'}
      </Text>
      <Text variant="titleMedium" style={estilos.tema}>
        {sesion.titulo}
      </Text>
      <Text variant="bodyMedium" style={estilos.dato}>
        {[fechaCompleta(sesion.fecha), sesion.hora].filter(Boolean).join(' · ')}
      </Text>
    </View>
  ) : null;

  if (yaRegistrada || recienRegistrada) {
    return (
      <View style={estilos.contenido}>
        {resumen}
        <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
          <Upecito pose="listo" />
          <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
            {confirmacion}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            Volver
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.contenido}>
      {resumen}
      <Text variant="bodyMedium" style={estilos.instruccion}>
        Escanea el código QR que te muestra el facilitador de la sesión.
      </Text>
      {!conApi && sesion && asistencia.isPending ? (
        <EstadoCarga mensaje="Revisando tu asistencia…" />
      ) : (
        <EscanerCodigos tipos={['qr']} onLeido={leido} />
      )}
      {registrar.isPending ? <EstadoCarga mensaje="Registrando tu asistencia…" /> : null}
      {rechazo ? (
        <View accessibilityLiveRegion="polite">
          <AvisoError mensaje={`${rechazo} Toca "Escanear otro" para intentarlo de nuevo.`} />
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacio.m },
  resumen: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  etiqueta: { color: colores.primario, fontFamily: fuentes.seminegrita },
  tema: { color: colores.texto, fontFamily: fuentes.negrita },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  instruccion: { color: colores.texto },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.l },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
