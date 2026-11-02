/**
 * Vista semanal del calendario de un espacio (HU-17, CA1 y CA2).
 * Arriba, una tira de lunes a sábado (los domingos no se reserva) con el resumen de cada día;
 * debajo, las franjas del día elegido.
 * No es una grilla de columnas por horas: en un celular, el estado quedaría solo con color.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { DiaDisponibilidad, FranjaDisponibilidad } from '@/types';
import { abreviaturaDia, fechaCompleta, numeroDia, resumenDia } from '@/utils/calendario';
import { RESUMEN_DIA } from '@/utils/disponibilidad';

import { FilaFranja } from './FilaFranja';

type Props = {
  /** Los días de la semana que se muestran, de lunes a sábado ('AAAA-MM-DD'). */
  semana: string[];
  /** La disponibilidad de esos días; un día sin datos se muestra sin resumen. */
  dias: DiaDisponibilidad[];
  diaElegido: string;
  onElegirDia: (fecha: string) => void;
  onElegirFranja: (fecha: string, franja: FranjaDisponibilidad) => void;
};

export function VistaSemana({ semana, dias, diaElegido, onElegirDia, onElegirFranja }: Props) {
  const porFecha = new Map(dias.map((dia) => [dia.fecha, dia]));
  const elegido = porFecha.get(diaElegido);

  return (
    <View style={estilos.vista}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.tira}
        accessibilityRole="tablist"
        accessibilityLabel="Días de la semana"
      >
        {semana.map((fecha) => (
          <BotonDia
            key={fecha}
            fecha={fecha}
            dia={porFecha.get(fecha)}
            elegido={fecha === diaElegido}
            onPress={() => onElegirDia(fecha)}
          />
        ))}
      </ScrollView>

      <Text variant="titleMedium" style={estilos.tituloDia} accessibilityRole="header">
        {fechaCompleta(diaElegido)}
      </Text>
      {elegido ? (
        <FranjasDelDia dia={elegido} onElegirFranja={onElegirFranja} />
      ) : null}
    </View>
  );
}

function BotonDia({
  fecha,
  dia,
  elegido,
  onPress,
}: {
  fecha: string;
  dia?: DiaDisponibilidad;
  elegido: boolean;
  onPress: () => void;
}) {
  const resumen = dia ? resumenDia(dia) : null;
  const marca = resumen ? RESUMEN_DIA[resumen.tipo] : null;
  const colorTexto = elegido ? colores.superficie : colores.texto;

  return (
    <View style={[estilos.dia, elegido ? estilos.diaElegido : null]}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: elegido }}
        accessibilityLabel={`${fechaCompleta(fecha)}${resumen ? `, ${resumen.texto}` : ''}`}
      >
        <View style={estilos.contenidoDia}>
          <Text variant="labelMedium" style={{ color: colorTexto }}>
            {abreviaturaDia(fecha)}
          </Text>
          <Text variant="titleMedium" style={[estilos.numero, { color: colorTexto }]}>
            {numeroDia(fecha)}
          </Text>
          {marca ? (
            <Icon source={marca.icono} size={16} color={elegido ? colores.superficie : marca.color} />
          ) : null}
        </View>
      </TouchableRipple>
    </View>
  );
}

function FranjasDelDia({
  dia,
  onElegirFranja,
}: {
  dia: DiaDisponibilidad;
  onElegirFranja: (fecha: string, franja: FranjaDisponibilidad) => void;
}) {
  if (!dia.habil || dia.franjas.length === 0) {
    const { texto } = resumenDia(dia);
    return (
      <View style={estilos.sinFranjas}>
        <Icon source={RESUMEN_DIA.no_habil.icono} size={24} color={colores.textoSecundario} />
        <Text variant="bodyMedium" style={estilos.textoSinFranjas}>
          {dia.habil ? 'Este día no tiene franjas de atención.' : texto}
        </Text>
      </View>
    );
  }

  return (
    <View style={estilos.franjas}>
      {dia.franjas.map((franja) => (
        <FilaFranja
          key={franja.horaInicio}
          fecha={dia.fecha}
          franja={franja}
          onElegir={(elegida) => onElegirFranja(dia.fecha, elegida)}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  vista: { gap: espacio.m },
  // flexGrow reparte el ancho entre los días; con letra grande, la tira se desplaza de lado.
  tira: { flexGrow: 1, gap: espacio.xs },
  dia: {
    flexGrow: 1,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  diaElegido: { backgroundColor: colores.primarioOscuro },
  contenidoDia: {
    alignItems: 'center',
    gap: espacio.xs,
    paddingVertical: espacio.s,
    paddingHorizontal: espacio.s,
  },
  numero: { fontFamily: fuentes.negrita },
  tituloDia: { color: colores.texto, fontFamily: fuentes.seminegrita },
  franjas: { gap: espacio.s },
  sinFranjas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficieVariante,
  },
  textoSinFranjas: { flex: 1, color: colores.texto },
});
