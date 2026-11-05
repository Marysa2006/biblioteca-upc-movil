/**
 * Operaciones por mes en columnas verticales (HU-26, CA1), como "Afluencia semanal" del mockup.
 * Sin paquete de gráficos: cada columna es un View con la altura proporcional al mes con más
 * operaciones, con su número encima y el mes abreviado debajo. El mes con más operaciones va en
 * el verde oscuro y dice "Pico", así no depende solo del color.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { ConteoIndicador } from '@/types';
import {
  abreviaturaMes,
  conMayuscula,
  hayVariosAnios,
  textoOperaciones,
} from '@/utils/filtrosEstadisticas';

/** Alto del área de las columnas. */
const ALTO = espacio.xl * 4;

type Props = {
  titulo: string;
  descripcion?: string;
  datos: ConteoIndicador[];
};

export function ColumnasMes({ titulo, descripcion, datos }: Props) {
  const maximo = Math.max(...datos.map((mes) => mes.cantidad), 1);
  const conAnio = hayVariosAnios(datos);
  // Solo se marca el pico si hay más de un mes para comparar.
  const pico = datos.length > 1 ? datos.find((mes) => mes.cantidad === maximo) : undefined;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        {descripcion ? (
          <Text variant="bodySmall" style={estilos.descripcion}>
            {descripcion}
          </Text>
        ) : null}
      </View>

      <View style={estilos.columnas}>
        {datos.map((mes) => {
          const esPico = mes === pico;
          return (
            <View
              key={mes.etiqueta}
              style={estilos.columna}
              accessible
              accessibilityLabel={`${conMayuscula(mes.etiqueta)}: ${textoOperaciones(mes.cantidad)}${esPico ? ', el mes con más operaciones' : ''}`}
            >
              {esPico ? (
                <Text variant="labelSmall" style={estilos.pico}>
                  Pico
                </Text>
              ) : null}
              <Text variant="labelLarge" style={estilos.numero}>
                {mes.cantidad}
              </Text>
              <View
                style={[
                  estilos.barra,
                  {
                    height: Math.max((mes.cantidad / maximo) * ALTO, espacio.xs),
                    backgroundColor: esPico ? colores.primarioOscuro : colores.primario,
                  },
                ]}
              />
              <Text variant="labelMedium" style={estilos.mes}>
                {abreviaturaMes(mes.etiqueta, conAnio)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  columnas: { flexDirection: 'row', alignItems: 'flex-end', gap: espacio.s },
  columna: { flex: 1, alignItems: 'center', gap: espacio.xs },
  pico: {
    paddingHorizontal: espacio.xs,
    borderRadius: espacio.xs,
    overflow: 'hidden',
    color: colores.texto,
    backgroundColor: colores.amarilloUpc,
    fontFamily: fuentes.negrita,
  },
  numero: { color: colores.texto, fontFamily: fuentes.seminegrita },
  barra: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radio.boton / 2,
    borderTopRightRadius: radio.boton / 2,
  },
  mes: { color: colores.textoSecundario },
});
