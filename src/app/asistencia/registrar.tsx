/**
 * Registrar la asistencia a una asesoría con el QR del facilitador (HU-32, función plus).
 * Pantalla apilada de la comunidad; se abre con ?citaId desde Mis citas o desde el detalle de
 * la asesoría en Mis solicitudes (BotonRegistrarAsistencia).
 * - CA1: escanea el QR vigente y, al registrarse, muestra la confirmación en el mismo lugar.
 * - CA2: si el QR venció, la asistencia está cerrada o es de otra sesión, dice el motivo y deja
 *   escanear otra vez. El QR de otra cita se rechaza aquí, antes de enviarlo.
 * - CA3: si ya se registró, lo dice y no vuelve a enviar.
 * - CA4: sin permiso de cámara, EscanerCodigos explica para qué se usa y lleva a los ajustes.
 * Pide sesión. Solo funciona mientras se puede tomar la asistencia (puedeTomarAsistencia).
 *
 * Patrón de datos: useMisCitas(), useAsistencia() y useRegistrarAsistenciaQr() (src/hooks).
 */
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
import { useMisCitas } from '@/hooks/useAsesorias';
import { useAsistencia, useRegistrarAsistenciaQr } from '@/hooks/useAsistencia';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import {
  leerCodigoAsistencia,
  MINUTOS_ANTES_ASISTENCIA,
  puedeTomarAsistencia,
} from '@/utils/asistencia';
import { fechaCompleta } from '@/utils/calendario';
import { textoHorario } from '@/utils/fechas';
import { mensajeErrorGuardar } from '@/utils/errores';

const NO_ES_QR_ASISTENCIA =
  'Ese código no es de una asistencia de la biblioteca. Escanea el QR que te muestra el facilitador.';
const QR_DE_OTRA_SESION =
  'Ese código es de otra sesión. Escanea el QR de tu asesoría, el que te muestra el facilitador.';

export default function RegistrarAsistencia() {
  const usuario = useSesion((estado) => estado.usuario);

  return (
    <>
      <EncabezadoApilado titulo="Registrar asistencia" />
      <Pantalla titulo="Registrar asistencia" conEncabezado>
        {usuario ? (
          usaApi('asistencia') ? <Escaneo /> : <Contenido />
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
  const { citaId } = useLocalSearchParams<{ citaId: string }>();
  const citas = useMisCitas();

  if (citas.isPending) return <EstadoCarga mensaje="Cargando tu asesoría…" />;
  if (citas.isError) {
    return (
      <EstadoError mensaje="No pudimos cargar tu asesoría." onReintentar={() => citas.refetch()} />
    );
  }
  const cita = citas.data.find((actual) => actual.id === citaId);
  if (!cita) {
    return <EstadoVacio mensaje="No encontramos esta asesoría entre tus citas." pose="buscando" />;
  }
  if (!puedeTomarAsistencia(cita)) {
    return (
      <EstadoVacio
        mensaje={`La asistencia se registra el día de la asesoría, desde ${MINUTOS_ANTES_ASISTENCIA} minutos antes de empezar, con la cita aprobada.`}
      />
    );
  }
  return <Escaneo cita={cita} />;
}

function Escaneo({ cita }: { cita?: Cita }) {
  const usuario = useSesion((estado) => estado.usuario);
  const asistencia = useAsistencia(cita?.id ?? '');
  const registrar = useRegistrarAsistenciaQr();
  const [rechazo, setRechazo] = useState<string | null>(null);
  const [recienRegistrada, setRecienRegistrada] = useState(false);

  const yaRegistrada = registrar.data?.yaRegistrada ??
    asistencia.data?.registros.some((registro) => registro.usuarioId === usuario?.id) ?? false;
  const confirmacion = yaRegistrada ? 'Tu asistencia a esta sesión ya estaba registrada.'
    : 'Tu asistencia quedó registrada.';

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  const anuncio = yaRegistrada || recienRegistrada ? confirmacion : rechazo;
  useEffect(() => {
    if (Platform.OS === 'ios' && anuncio) AccessibilityInfo.announceForAccessibility(anuncio);
  }, [anuncio]);

  const leido = ({ datos }: LecturaCodigo) => {
    if (registrar.isPending || yaRegistrada || recienRegistrada) return;
    setRechazo(null);
    if (!cita) {
      registrar.mutate(datos, {
        onSuccess: () => setRecienRegistrada(true),
        onError: (error) => setRechazo(mensajeErrorGuardar(error)),
      });
      return;
    }
    const qr = leerCodigoAsistencia(datos);
    if (!qr) {
      setRechazo(NO_ES_QR_ASISTENCIA);
      return;
    }
    // CA2: el QR de otra sesión no se envía.
    if (qr.sesionId !== cita.id) {
      setRechazo(QR_DE_OTRA_SESION);
      return;
    }
    // CA3: si ya estaba registrada, no se envía otra vez.
    if (yaRegistrada) return;
    registrar.mutate(datos, {
      onSuccess: () => setRecienRegistrada(true),
      onError: (error) => setRechazo(mensajeErrorGuardar(error)),
    });
  };

  const resumen = cita ? (
    <View style={estilos.resumen}>
      <Text variant="labelMedium" style={estilos.etiqueta}>
        Asesoría
      </Text>
      <Text variant="titleMedium" style={estilos.tema}>
        {cita.tema}
      </Text>
      <Text variant="bodyMedium" style={estilos.dato}>
        {`${fechaCompleta(cita.fecha)} · ${textoHorario(cita.horaInicio, cita.horaFin)}`}
      </Text>
      <Text variant="bodyMedium" style={estilos.secundario}>
        {`Con ${cita.facilitador}`}
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
      {cita && asistencia.isPending ? (
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
  secundario: { color: colores.textoSecundario },
  instruccion: { color: colores.texto },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.l },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
