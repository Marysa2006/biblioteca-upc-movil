/**
 * Confirmación de una cita de asesoría (HU-14): el resumen de la franja elegida y la necesidad.
 * - CA1: valida la necesidad con esquemaCita (el error bajo el campo) y la envía con onConfirmar.
 * - CA2: si la franja se ocupó al confirmar, lo explica y el botón principal pasa a ser
 *   "Elegir otra franja", que vuelve a las franjas.
 * No guarda: la pantalla llama al hook con onConfirmar y le pasa guardando y los errores.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { CampoFormulario } from '@/components/reservas/CampoFormulario';
import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { FranjaAsesoria } from '@/types';
import { esquemaCita, type FormularioCita as DatosCita } from '@/utils/asesorias';
import { fechaCompleta } from '@/utils/calendario';

const FRANJA_OCUPADA = 'Esa franja se acaba de ocupar. Elige otra para agendar tu asesoría.';

type Props = {
  nombreTema: string;
  franja: FranjaAsesoria;
  guardando: boolean;
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
  const error = franjaOcupada ? FRANJA_OCUPADA : mensajeError;

  // En Android lo anuncia accessibilityLiveRegion (en AvisoError); en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && error) {
      AccessibilityInfo.announceForAccessibility(error);
    }
  }, [error]);

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
});
