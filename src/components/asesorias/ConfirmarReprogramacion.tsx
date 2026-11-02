/**
 * Confirmación para reprogramar una cita de asesoría (HU-14, CA3): la franja de antes y la
 * nueva, sin volver a pedir la necesidad. Si la nueva se ocupó al confirmar (CA2), lo explica
 * y ofrece elegir otra. Reprogramada, la confirmación queda en el mismo lugar.
 * No guarda: la pantalla llama al hook con onConfirmar y le pasa guardando y los errores.
 */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita, FranjaAsesoria } from '@/types';
import { fechaCompleta } from '@/utils/calendario';

const FRANJA_OCUPADA = 'Esa franja se acaba de ocupar. Elige otra para tu asesoría.';

type Props = {
  cita: Cita;
  /** Solo lo que se muestra: si la franja se ocupa, ya no llega en la consulta. */
  nueva: Pick<FranjaAsesoria, 'fecha' | 'horaInicio' | 'horaFin'>;
  guardando: boolean;
  /** La cita ya quedó en la franja nueva; se muestra la confirmación. */
  reprogramada: boolean;
  /** CA2: la franja nueva ya no tiene cupo. */
  franjaOcupada: boolean;
  /** Cualquier otro error al guardar, ya en texto (mensajeErrorGuardar). */
  mensajeError: string | null;
  onConfirmar: () => void;
  onElegirOtra: () => void;
};

const textoCuando = (franja: Pick<FranjaAsesoria, 'fecha' | 'horaInicio' | 'horaFin'>) =>
  `${fechaCompleta(franja.fecha)} · ${franja.horaInicio} – ${franja.horaFin}`;

export function ConfirmarReprogramacion({
  cita,
  nueva,
  guardando,
  reprogramada,
  franjaOcupada,
  mensajeError,
  onConfirmar,
  onElegirOtra,
}: Props) {
  const antes = textoCuando(cita);
  const ahora = textoCuando(nueva);
  const confirmacion = `Tu asesoría de ${cita.tema} quedó para el ${ahora}. Te dejamos una notificación con el cambio.`;
  const error = franjaOcupada ? FRANJA_OCUPADA : mensajeError;
  const aviso = reprogramada ? confirmacion : error;

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  if (reprogramada) {
    return (
      <View style={estilos.confirmacion} accessibilityLiveRegion="polite">
        <Icon source="check-circle-outline" size={40} color={colores.primario} />
        <Text variant="bodyLarge" style={estilos.textoConfirmacion}>
          {confirmacion}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.dismissTo('/asesorias/mis-citas')}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Volver a mis citas de asesoría"
        >
          Volver a mis citas
        </Button>
      </View>
    );
  }

  return (
    <View style={estilos.contenido}>
      <View style={estilos.resumen}>
        <Text variant="labelMedium" style={estilos.etiqueta}>
          Asesoría
        </Text>
        <Text variant="titleMedium" style={estilos.tema}>
          {cita.tema}
        </Text>
        <View style={estilos.cambio}>
          <Text variant="bodySmall" style={estilos.secundario}>
            Antes
          </Text>
          <Text variant="bodyMedium" style={estilos.antes}>
            {antes}
          </Text>
        </View>
        <View style={estilos.cambio}>
          <Text variant="bodySmall" style={estilos.secundario}>
            Ahora
          </Text>
          <Text variant="bodyMedium" style={estilos.dato}>
            {ahora}
          </Text>
        </View>
      </View>

      {error ? <AvisoError mensaje={error} /> : null}

      {franjaOcupada ? (
        <Button
          mode="contained"
          onPress={onElegirOtra}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Elegir otra franja de ${cita.tema}`}
        >
          Elegir otra franja
        </Button>
      ) : (
        <Button
          mode="contained"
          onPress={onConfirmar}
          loading={guardando}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Pasar la asesoría de ${cita.tema} del ${antes} al ${ahora}`}
        >
          Confirmar cambio
        </Button>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacio.m },
  resumen: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  etiqueta: { color: colores.primario, fontFamily: fuentes.seminegrita },
  tema: { color: colores.texto, fontFamily: fuentes.negrita },
  cambio: { gap: espacio.xs },
  secundario: { color: colores.textoSecundario },
  // La de antes se tacha, pero también dice "Antes": no depende solo del estilo.
  antes: { color: colores.textoSecundario, textDecorationLine: 'line-through' },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  contenidoBoton: { paddingVertical: espacio.xs },
  confirmacion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  textoConfirmacion: { color: colores.texto, textAlign: 'center' },
});
