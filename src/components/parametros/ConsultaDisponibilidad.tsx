/**
 * Consultar disponibilidad (HU-28, CA3): dice si un día se ofrece para reservas y citas,
 * con los parámetros GUARDADOS. Usa esDiaHabil(), la misma regla que usarán esas HU.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { SelectorFecha } from '@/components/espacios/SelectorFecha';

import { colores, coloresEstado, espacio, radio } from '@/theme';
import type { Parametros } from '@/types';
import { sumarMeses } from '@/utils/calendario';
import { esFechaValida, fechaLegible, hoyISO } from '@/utils/fechas';
import { motivoNoDisponible } from '@/utils/parametros';

import { TarjetaSeccion } from './TarjetaSeccion';

export function ConsultaDisponibilidad({ parametros }: { parametros: Parametros }) {
  const [fecha, setFecha] = useState('');
  const [hoy] = useState(hoyISO);
  const valida = esFechaValida(fecha);

  const motivo = valida ? motivoNoDisponible(fecha, parametros) : null;
  const resultado = valida
    ? motivo
      ? `${fechaLegible(fecha)}: no disponible, ${motivo}.`
      : `${fechaLegible(fecha)}: día hábil, se ofrece para reservas y citas.`
    : null;

  // En Android lo anuncia accessibilityLiveRegion; en iOS, aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && resultado) {
      AccessibilityInfo.announceForAccessibility(resultado);
    }
  }, [resultado]);

  return (
    <TarjetaSeccion
      titulo="Consultar disponibilidad"
      ayuda="Revisa si un día se ofrece para reservas y citas, con los parámetros guardados."
    >
      {/* Todos los días se pueden elegir: justo es para saber si se ofrecen o no. */}
      <SelectorFecha
        etiqueta="Fecha para consultar"
        valor={fecha}
        onCambiar={setFecha}
        motivoNoElegible={() => null}
        mesMinimo={sumarMeses(hoy, -12)}
        mesMaximo={sumarMeses(hoy, 24)}
      />

      {resultado ? (
        <View
          style={[estilos.resultado, motivo ? estilos.noDisponible : estilos.disponible]}
          accessibilityLiveRegion="polite"
        >
          <Icon
            source={motivo ? 'calendar-remove-outline' : 'calendar-check-outline'}
            size={24}
            color={motivo ? coloresEstado.rechazada.texto : colores.primarioOscuro}
          />
          <Text
            variant="bodyMedium"
            style={[estilos.texto, motivo ? estilos.textoNoDisponible : estilos.textoDisponible]}
          >
            {resultado}
          </Text>
        </View>
      ) : null}
    </TarjetaSeccion>
  );
}

const estilos = StyleSheet.create({
  resultado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
  },
  disponible: { backgroundColor: colores.primarioSuave },
  noDisponible: { backgroundColor: coloresEstado.rechazada.fondo },
  texto: { flex: 1 },
  textoDisponible: { color: colores.primarioOscuro },
  textoNoDisponible: { color: coloresEstado.rechazada.texto },
});
