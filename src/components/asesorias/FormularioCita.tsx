/**
 * Confirmación de una cita de asesoría (HU-14): el resumen de la franja elegida y la necesidad.
 * - CA1: valida la necesidad con esquemaCita (el error bajo el campo) y la envía con onConfirmar.
 * - CA2: si la franja se ocupó al confirmar, lo explica y el botón principal pasa a ser
 *   "Elegir otra franja", que vuelve a las franjas.
 * - Agendada, la confirmación queda en el mismo lugar, como en la reserva de espacios (HU-18).
 * No guarda: la pantalla llama al hook con onConfirmar y le pasa guardando y los errores.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { CampoFormulario } from '@/components/reservas/CampoFormulario';
import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { FranjaAsesoria } from '@/types';
import { esquemaCita, type FormularioCita as DatosCita } from '@/utils/asesorias';
import { fechaCompleta } from '@/utils/calendario';

const FRANJA_OCUPADA = 'Esa franja se acaba de ocupar. Elige otra para agendar tu asesoría.';

type Props = {
  nombreTema: string;
  /** Solo lo que se muestra: si la franja se ocupa, ya no llega en la consulta. */
  franja: Pick<FranjaAsesoria, 'fecha' | 'horaInicio' | 'horaFin'>;
  guardando: boolean;
  /** CA1: la cita quedó agendada; se muestra la confirmación. */
  agendada: boolean;
  /** CA2: la API respondió que la franja ya no tiene cupo. */
  franjaOcupada: boolean;
  /** Cualquier otro error al guardar, ya en texto (mensajeErrorGuardar). */
  mensajeError: string | null;
  onConfirmar: (necesidad: string) => void;
  onElegirOtra: () => void;
};

export function FormularioCita({
  nombreTema,
  franja,
  guardando,
  agendada,
  franjaOcupada,
  mensajeError,
  onConfirmar,
  onElegirOtra,
}: Props) {
  const { control, handleSubmit } = useForm<DatosCita>({
    resolver: zodResolver(esquemaCita),
    defaultValues: { necesidad: '' },
  });

  const cuando = `${fechaCompleta(franja.fecha)} · ${franja.horaInicio} – ${franja.horaFin}`;
  const confirmacion = `Tu asesoría de ${nombreTema} quedó agendada para el ${cuando}. Te dejamos una notificación con los datos.`;
  const error = franjaOcupada ? FRANJA_OCUPADA : mensajeError;
  const aviso = agendada ? confirmacion : error;

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  if (agendada) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Icon source="check-circle-outline" size={40} color={colores.primario} />
        <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
          {confirmacion}
        </Text>
        <View style={estilos.botones}>
          <Button
            mode="contained"
            onPress={() => router.replace('/asesorias/mis-citas')}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ver mis citas de asesoría"
          >
            Ver mis citas
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

  return (
    <View style={estilos.formulario}>
      <View style={estilos.resumen}>
        <Text variant="labelMedium" style={estilos.etiqueta}>
          Asesoría
        </Text>
        <Text variant="titleMedium" style={estilos.tema}>
          {nombreTema}
        </Text>
        <Text variant="bodyMedium" style={estilos.dato}>
          {cuando}
        </Text>
      </View>

      <CampoFormulario
        control={control}
        nombre="necesidad"
        etiqueta="¿Qué necesitas?"
        placeholder="Por ejemplo: citar un libro y un artículo en APA 7"
        multilinea
        deshabilitado={guardando || franjaOcupada}
      />

      {error ? <AvisoError mensaje={error} /> : null}

      {franjaOcupada ? (
        <Button
          mode="contained"
          onPress={onElegirOtra}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Elegir otra franja de ${nombreTema}`}
        >
          Elegir otra franja
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={handleSubmit(({ necesidad }) => onConfirmar(necesidad.trim()))}
          loading={guardando}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Confirmar la asesoría de ${nombreTema} del ${cuando}`}
        >
          Confirmar
        </Button>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.m },
  resumen: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  etiqueta: { color: colores.primario, fontFamily: fuentes.seminegrita },
  tema: { color: colores.texto, fontFamily: fuentes.negrita },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  contenidoBoton: { paddingVertical: espacio.xs },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
  botones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: espacio.s },
});
