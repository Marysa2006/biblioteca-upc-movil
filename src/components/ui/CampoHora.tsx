/**
 * Campo de hora con el reloj del sistema: al tocarlo se abre el reloj de Android (24 horas)
 * y se elige la hora. No se escribe: así no hay errores de formato.
 * Las horas van cada 30 minutos (o en punto, con pasoMinutos 60): si se marca un minuto suelto,
 * se ajusta a la más cercana y se avisa debajo (también al lector de pantalla).
 * Entrega la hora como 'HH:MM'.
 *
 * El reloj es el DateTimePicker de @expo/ui (incluido en Expo Go): en Android abre un diálogo
 * al montarse, así que solo se monta mientras está abierto.
 */
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { HelperText, Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { esHoraValida, horaAlPaso, MINUTOS_PASO_HORA } from '@/utils/fechas';

/** La hora en la que abre el reloj si el campo está vacío. */
const HORA_INICIAL = '08:00';

type Props = {
  etiqueta: string;
  /** 'HH:MM' o vacío. */
  valor: string;
  onCambiar: (hora: string) => void;
  /** 30 (por defecto) o 60: las reservas de espacios van en punto. */
  pasoMinutos?: 30 | 60;
  mensajeError?: string;
  deshabilitado?: boolean;
};

/** 'HH:MM' → Date de hoy a esa hora, para el reloj. */
function aFecha(hora: string): Date {
  const [h, m] = (esHoraValida(hora) ? hora : HORA_INICIAL).split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(h, m, 0, 0);
  return fecha;
}

export function CampoHora({
  etiqueta,
  valor,
  onCambiar,
  pasoMinutos = MINUTOS_PASO_HORA,
  mensajeError,
  deshabilitado = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [ajuste, setAjuste] = useState<string | null>(null);

  const elegir = (fecha: Date) => {
    setAbierto(false);
    const { hora, ajustada } = horaAlPaso(fecha.getHours(), fecha.getMinutes(), pasoMinutos);
    const regla = pasoMinutos === 60 ? 'las horas van en punto' : 'las horas van cada 30 minutos';
    const aviso = ajustada ? `Se ajustó a ${hora}: ${regla}.` : null;
    setAjuste(aviso);
    if (aviso && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(aviso);
    onCambiar(hora);
  };

  return (
    <View style={estilos.grupo}>
      <View style={[estilos.campo, mensajeError ? estilos.campoError : null, deshabilitado && estilos.deshabilitado]}>
        <TouchableRipple
          onPress={() => setAbierto(true)}
          disabled={deshabilitado}
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}: ${valor || 'sin elegir'}. Elegir hora`}
          accessibilityState={{ disabled: deshabilitado }}
        >
          <View style={estilos.contenido}>
            <Icon source="clock-outline" size={24} color={colores.primario} />
            <View style={estilos.textos}>
              <Text variant="labelMedium" style={estilos.etiqueta}>
                {etiqueta}
              </Text>
              <Text variant="bodyLarge" style={valor ? estilos.valor : estilos.vacio}>
                {valor || 'Elegir hora'}
              </Text>
            </View>
          </View>
        </TouchableRipple>
      </View>

      {mensajeError ? (
        <HelperText type="error" visible>
          {mensajeError}
        </HelperText>
      ) : ajuste ? (
        <HelperText type="info" visible style={estilos.ajuste} accessibilityLiveRegion="polite">
          {ajuste}
        </HelperText>
      ) : null}

      {abierto ? (
        <DateTimePicker
          mode="time"
          is24Hour
          value={aFecha(valor)}
          accentColor={colores.primario}
          positiveButton={{ label: 'Aceptar' }}
          negativeButton={{ label: 'Cancelar' }}
          onValueChange={(_, fecha) => elegir(fecha)}
          onDismiss={() => setAbierto(false)}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.xs },
  // Mismo borde que los campos de texto; overflow: 'hidden' recorta el ripple.
  campo: {
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  campoError: { borderColor: colores.error },
  deshabilitado: { opacity: 0.6 },
  // minHeight: mide como un TextInput y crece con la letra.
  contenido: {
    minHeight: espacio.xl + espacio.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  textos: { flex: 1 },
  etiqueta: { color: colores.textoSecundario },
  valor: { color: colores.texto, fontFamily: fuentes.seminegrita },
  vacio: { color: colores.textoSecundario },
  ajuste: { color: colores.textoSecundario },
});
