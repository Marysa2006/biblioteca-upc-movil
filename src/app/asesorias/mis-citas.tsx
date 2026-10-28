/**
 * Mis citas de asesoría (HU-14). Pantalla apilada; se abre desde el detalle del servicio de
 * asesorías o después de agendar.
 * - CA3: dentro del plazo (horasMinimasCancelacion, HU-28), cada cita se cancela con
 *   confirmación y su franja se libera; o se reprograma eligiendo otra franja del mismo tema.
 *   Fuera del plazo, la tarjeta explica hasta cuándo se podía. La API vuelve a validar (400).
 * Pide cuenta: sin sesión, invita a iniciarla y vuelve aquí después.
 *
 * Patrón de datos: useMisCitas() / useParametros() / useCancelarCita() (src/hooks)
 * → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { DialogoCancelarCita } from '@/components/asesorias/DialogoCancelarCita';
import { TarjetaCita } from '@/components/asesorias/TarjetaCita';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useCancelarCita, useMisCitas } from '@/hooks/useAsesorias';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, radio } from '@/theme';
import type { Cita } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { fechaLegible } from '@/utils/fechas';

export default function MisCitas() {
  const { usuario } = useRol();
  const citas = useMisCitas();
  const parametros = useParametros();
  const cancelar = useCancelarCita();
  const [porCancelar, setPorCancelar] = useState<Cita | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const abrirCancelar = (cita: Cita) => {
    cancelar.reset();
    setPorCancelar(cita);
  };

  const confirmarCancelar = (cita: Cita) => {
    cancelar.mutate(cita.id, {
      onSuccess: () => {
        setPorCancelar(null);
        setAviso(
          `Cancelaste tu asesoría de ${cita.tema} del ${fechaLegible(cita.fecha)}. La franja quedó libre.`,
        );
      },
    });
  };

  const reprogramar = (cita: Cita) => {
    setAviso(null);
    router.push({
      pathname: '/asesorias/[temaId]',
      params: { temaId: cita.temaId, reprogramar: cita.id },
    });
  };

  const reintentar = () => {
    if (citas.isError) citas.refetch();
    if (parametros.isError) parametros.refetch();
  };

  let contenido;
  if (!usuario) {
    contenido = (
      <InvitarSesion
        mensaje="Inicia sesión con tu cuenta institucional para ver tus citas de asesoría."
        etiqueta="Iniciar sesión para ver mis citas"
      />
    );
  } else if (citas.isPending || parametros.isPending) {
    contenido = <EstadoCarga mensaje="Cargando tus citas…" />;
  } else if (citas.isError || parametros.isError) {
    contenido = <EstadoError mensaje="No pudimos cargar tus citas." onReintentar={reintentar} />;
  } else if (citas.data.length === 0) {
    contenido = (
      <View style={estilos.vacio}>
        <EstadoVacio mensaje="Todavía no tienes citas de asesoría." />
        <Button
          mode="contained"
          onPress={() => router.push('/asesorias')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Agendar una asesoría"
        >
          Agendar asesoría
        </Button>
      </View>
    );
  } else {
    const horas = parametros.data.horasMinimasCancelacion;
    contenido = citas.data.map((cita) => (
      <TarjetaCita
        key={cita.id}
        cita={cita}
        horasCancelacion={horas}
        onCancelar={abrirCancelar}
        onReprogramar={reprogramar}
      />
    ));
  }

  return (
    <>
      <EncabezadoApilado titulo="Asesorías" />
      <Pantalla
        titulo="Mis citas"
        subtitulo="Tus asesorías agendadas. Puedes cancelarlas o reprogramarlas dentro del plazo."
        conEncabezado
        recarga={usuario ? { recargando: citas.isRefetching, onRecargar: () => citas.refetch() } : undefined}
      >
        {aviso ? (
          <View style={estilos.aviso} accessibilityLiveRegion="polite">
            <Text variant="bodyMedium" style={estilos.textoAviso}>
              {aviso}
            </Text>
          </View>
        ) : null}
        {contenido}
      </Pantalla>

      <DialogoCancelarCita
        cita={porCancelar}
        guardando={cancelar.isPending}
        mensajeError={cancelar.error ? mensajeErrorGuardar(cancelar.error) : null}
        onConfirmar={confirmarCancelar}
        onCerrar={() => setPorCancelar(null)}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  vacio: { gap: espacio.m },
  contenidoBoton: { paddingVertical: espacio.xs },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: { padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.primarioSuave },
  textoAviso: { color: colores.texto },
});
