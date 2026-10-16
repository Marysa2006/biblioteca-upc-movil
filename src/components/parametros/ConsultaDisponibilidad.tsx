/**
 * Consultar disponibilidad (HU-28, CA3): dice si un día se ofrece para reservas y citas,
 * con los parámetros GUARDADOS. Usa esDiaHabil(), la misma regla que usarán esas HU.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { HelperText, Icon, Text, TextInput } from 'react-native-paper';

import { colores, coloresEstado, espacio, radio } from '@/theme';
import type { Parametros } from '@/types';
import { esFechaValida, fechaLegible } from '@/utils/fechas';
import { motivoNoDisponible } from '@/utils/parametros';

import { TarjetaSeccion } from './TarjetaSeccion';

export function ConsultaDisponibilidad({ parametros }: { parametros: Parametros }) {
  const [fecha, setFecha] = useState('');
  const texto = fecha.trim();
  const completa = texto.length === 10;
  const valida = completa && esFechaValida(texto);

  const motivo = valida ? motivoNoDisponible(texto, parametros) : null;
  const resultado = valida
    ? motivo
      ? `${fechaLegible(texto)}: no disponible, ${motivo}.`
      : `${fechaLegible(texto)}: día hábil, se ofrece para reservas y citas.`
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
      <View>
        <TextInput
          mode="outlined"
          label="Fecha"
          placeholder="2026-10-20"
          value={fecha}
          onChangeText={setFecha}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          error={completa && !valida}
          accessibilityLabel="Fecha para consultar, formato año, mes y día"
        />
        <HelperText type="error" visible={completa && !valida}>
          Usa el formato AAAA-MM-DD, por ejemplo 2026-10-20.
        </HelperText>
      </View>

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
