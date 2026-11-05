/**
 * Tomar la asistencia de una cita con QR (HU-33, función plus). Pantalla apilada del personal;
 * se abre desde el detalle de la cita de la Agenda con ?id, desde y hasta: la cita sale de la
 * misma consulta de la agenda, así que viene de la caché.
 * - CA1: "Abrir asistencia" muestra un QR que solo sirve para esta sesión y vence.
 * - CA2: la lista de asistentes y el total se actualizan solos mientras está abierta.
 * - CA3: si quien pidió la cita no pudo escanear, el facilitador la marca a mano.
 * - CA4: "Cerrar asistencia", con confirmación; después el QR deja de aceptar registros.
 *
 * Patrón de datos: useAsistencia() y sus mutaciones (src/hooks) → src/api/asistencia.ts → mock.
 */
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { DialogoCerrarAsistencia } from '@/components/asistencia/DialogoCerrarAsistencia';
import { ListaAsistentes } from '@/components/asistencia/ListaAsistentes';
import { QrAsistencia } from '@/components/asistencia/QrAsistencia';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  AvisoError,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useAgenda } from '@/hooks/useAsesorias';
import {
  useAbrirAsistencia,
  useAsistencia,
  useCerrarAsistencia,
  useMarcarAsistenciaManual,
} from '@/hooks/useAsistencia';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import {
  minutosParaVencer,
  MINUTOS_ANTES_ASISTENCIA,
  puedeTomarAsistencia,
} from '@/utils/asistencia';
import { fechaCompleta } from '@/utils/calendario';
import { mensajeErrorGuardar } from '@/utils/errores';

type Parametros = { id: string; desde: string; hasta: string };

const TITULO = 'Tomar asistencia';

/** Cada cuánto se recalcula el tiempo que le queda al código. */
const CADA_MEDIO_MINUTO = 30_000;

export default function TomarAsistencia() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Detalle de la cita" />
      <Pantalla titulo={TITULO} conEncabezado>
        {tienePermiso('asesorias') ? <Asistencia /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Asistencia() {
  const { id, desde, hasta } = useLocalSearchParams<Parametros>();
  const { esAdministrador } = useRol();
  const agenda = useAgenda(desde ?? '', hasta ?? '', esAdministrador ? 'todas' : undefined);
  const cita = agenda.data?.find((actual) => actual.id === id);

  if (agenda.isPending) return <EstadoCarga mensaje="Cargando la cita…" />;
  if (agenda.isError) {
    return (
      <EstadoError mensaje="No pudimos cargar la cita." onReintentar={() => agenda.refetch()} />
    );
  }
  if (!cita) return <EstadoVacio mensaje="No encontramos esta cita en la agenda." />;
  if (!puedeTomarAsistencia(cita)) {
    return (
      <EstadoVacio
        mensaje={`La asistencia se toma el día de la cita, desde ${MINUTOS_ANTES_ASISTENCIA} minutos antes de empezar.`}
      />
    );
  }
  return <ControlAsistencia cita={cita} />;
}

function ControlAsistencia({ cita }: { cita: Cita }) {
  const cerrar = useCerrarAsistencia();
  const asistencia = useAsistencia(cita.id, { actualizar: !cerrar.isSuccess });
  const abrir = useAbrirAsistencia();
  const marcar = useMarcarAsistenciaManual();
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());

  // El tiempo que le queda al código se recalcula cada medio minuto.
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), CADA_MEDIO_MINUTO);
    return () => clearInterval(intervalo);
  }, []);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  if (asistencia.isPending) return <EstadoCarga mensaje="Cargando la asistencia…" />;
  if (asistencia.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar la asistencia."
        onReintentar={() => asistencia.refetch()}
      />
    );
  }

  const { codigo, registros, total } = asistencia.data;
  // Cerrada según la API (también al volver a entrar, #196) o recién cerrada aquí, mientras
  // la consulta se actualiza.
  const cerrada = asistencia.data.cerrada || cerrar.isSuccess;
  const abierta = codigo != null && !cerrada;
  const yaRegistrada = registros.some((registro) => registro.usuarioId === cita.solicitanteId);

  const abrirAsistencia = () => {
    setAviso(null);
    abrir.mutate(cita.id);
  };

  const marcarAMano = () => {
    setAviso(null);
    marcar.mutate(
      { sesionId: cita.id, usuarioId: cita.solicitanteId },
      { onSuccess: () => setAviso(`Marcamos la asistencia de ${cita.solicitante} a mano.`) },
    );
  };

  const cerrarAsistencia = () => {
    cerrar.mutate(cita.id, {
      onSuccess: (resultado) => {
        setConfirmarCierre(false);
        setAviso(
          `Cerramos la asistencia con ${resultado.total === 1 ? '1 asistente' : `${resultado.total} asistentes`}.`,
        );
      },
    });
  };

  const errorAccion = abrir.error ?? marcar.error;

  return (
    <View style={estilos.contenido}>
      <View style={estilos.resumen}>
        <Text variant="titleMedium" style={estilos.tema}>
          {cita.tema}
        </Text>
        <Text variant="bodyMedium" style={estilos.texto}>
          {`${fechaCompleta(cita.fecha)} · ${cita.horaInicio} a ${cita.horaFin}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Pidió la cita: ${cita.solicitante}`}
        </Text>
      </View>

      {aviso ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Text variant="bodyMedium" style={estilos.texto}>
            {aviso}
          </Text>
        </View>
      ) : null}
      {errorAccion ? <AvisoError mensaje={mensajeErrorGuardar(errorAccion)} /> : null}

      {abierta ? (
        <QrAsistencia
          codigo={codigo}
          minutosRestantes={minutosParaVencer(codigo.vence, ahora)}
          generando={abrir.isPending}
          onGenerar={abrirAsistencia}
        />
      ) : cerrada ? (
        <View style={estilos.cerrada}>
          <Icon source="lock-outline" size={24} color={colores.textoSecundario} />
          <Text variant="bodyMedium" style={estilos.textoCerrada}>
            La asistencia está cerrada: el QR ya no acepta registros.
          </Text>
        </View>
      ) : (
        <View style={estilos.abrir}>
          <Text variant="bodyMedium" style={estilos.texto}>
            Al abrirla se muestra un QR que solo sirve para esta sesión, por tiempo limitado.
          </Text>
          <Button
            mode="contained"
            icon="qrcode"
            onPress={abrirAsistencia}
            loading={abrir.isPending}
            disabled={abrir.isPending}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Abrir la asistencia y mostrar el código QR"
          >
            Abrir asistencia
          </Button>
        </View>
      )}

      <ListaAsistentes registros={registros} total={total} />

      {abierta && !yaRegistrada ? (
        <Button
          mode="outlined"
          icon="hand-back-right-outline"
          onPress={marcarAMano}
          loading={marcar.isPending}
          disabled={marcar.isPending}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Marcar a mano la asistencia de ${cita.solicitante}, si no pudo escanear`}
        >
          {`Marcar a ${cita.solicitante}`}
        </Button>
      ) : null}

      {abierta ? (
        <Button
          mode="contained-tonal"
          icon="lock-outline"
          onPress={() => {
            cerrar.reset();
            setConfirmarCierre(true);
          }}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar la asistencia"
        >
          Cerrar asistencia
        </Button>
      ) : null}

      <DialogoCerrarAsistencia
        visible={confirmarCierre}
        total={total}
        guardando={cerrar.isPending}
        mensajeError={cerrar.error ? mensajeErrorGuardar(cerrar.error) : null}
        onConfirmar={cerrarAsistencia}
        onCerrar={() => setConfirmarCierre(false)}
      />
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
  tema: { color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: {
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  abrir: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  cerrada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficieVariante,
  },
  textoCerrada: { flex: 1, color: colores.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
});
