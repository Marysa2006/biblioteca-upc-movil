/**
 * Jornada de asesoría en la administración (HU-13): tema, facilitador, días, horario,
 * duración, cupos, modalidad, vigencia y fechas excluidas. Activa o Inactiva va con texto.
 * Toda la tarjeta se presiona para editar; la flecha de la derecha lo indica.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Jornada } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { describirDias, NOMBRE_MODALIDAD } from '@/utils/jornadas';

type Props = {
  jornada: Jornada;
  tema: string;
  facilitador: string;
  onEditar: () => void;
};

export function TarjetaJornada({ jornada, tema, facilitador, onEditar }: Props) {
  const { activa } = jornada;
  const datos: { icono: string; texto: string }[] = [
    { icono: 'account-tie-outline', texto: facilitador },
    { icono: 'calendar-week', texto: describirDias(jornada.dias) },
    {
      icono: 'clock-outline',
      texto: `${jornada.horaInicio} a ${jornada.horaFin} · citas de ${jornada.duracionMinutos} min · ${jornada.cupos} ${jornada.cupos === 1 ? 'cupo' : 'cupos'}`,
    },
    {
      icono: jornada.modalidad === 'presencial' ? 'account-group-outline' : 'laptop',
      texto: NOMBRE_MODALIDAD[jornada.modalidad],
    },
    {
      icono: 'calendar-range',
      texto: `Del ${fechaLegible(jornada.vigenciaDesde)} al ${fechaLegible(jornada.vigenciaHasta)}`,
    },
  ];
  if (jornada.excepciones.length > 0) {
    datos.push({
      icono: 'calendar-remove-outline',
      texto: `Sin atención: ${[...jornada.excepciones].sort().map(fechaLegible).join(', ')}`,
    });
  }

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onEditar}
        style={estilos.contenido}
        accessibilityRole="button"
        accessibilityLabel={`Editar la jornada de ${tema} de ${facilitador}`}
      >
        <View style={estilos.cuerpo}>
          <View style={estilos.encabezado}>
            <Text variant="titleMedium" style={estilos.tema}>
              {tema}
            </Text>
            <View style={[estilos.estado, activa ? estilos.estadoActivo : estilos.estadoInactivo]}>
              <Text
                variant="labelMedium"
                style={activa ? estilos.textoActivo : estilos.textoInactivo}
              >
                {activa ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
            <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
          </View>

          {datos.map((dato) => (
            <View key={dato.icono} style={estilos.dato}>
              <Icon source={dato.icono} size={18} color={colores.textoSecundario} />
              <Text variant="bodyMedium" style={estilos.textoDato}>
                {dato.texto}
              </Text>
            </View>
          ))}
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: el efecto al presionar no se sale de las esquinas redondeadas.
  tarjeta: {
    overflow: 'hidden',
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  contenido: { padding: espacio.m },
  cuerpo: { gap: espacio.s },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tema: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  estado: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  estadoActivo: { backgroundColor: colores.primarioSuave },
  estadoInactivo: { backgroundColor: coloresEstado.cancelada.fondo },
  textoActivo: { color: colores.primarioOscuro },
  textoInactivo: { color: coloresEstado.cancelada.texto },
  dato: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  textoDato: { flex: 1, color: colores.texto },
});
