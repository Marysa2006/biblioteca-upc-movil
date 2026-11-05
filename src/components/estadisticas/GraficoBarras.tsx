/**
 * Gráfico de barras horizontales de un indicador (HU-26, CA1). Sin paquete de gráficos: cada
 * barra es un View con el ancho proporcional al grupo más grande, y lleva su número y su
 * porcentaje en texto, así no depende solo del dibujo. El lector de pantalla lee cada barra
 * como una frase.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { ConteoIndicador } from '@/types';
import { textoOperaciones, textoPorcentaje } from '@/utils/filtrosEstadisticas';

type Props = {
  titulo: string;
  /** Debajo del título, por ejemplo "Operaciones por servicio en el periodo". */
  descripcion?: string;
  datos: ConteoIndicador[];
  /** Total de operaciones del periodo: el porcentaje se calcula sobre él. */
  total: number;
  /**
   * Cuántas barras mostrar como máximo (por ejemplo, los 10 programas más usados). El resto se
   * resume en una línea con `textoResto`, por ejemplo (12) => "Y 12 programas más".
   */
  limite?: number;
  textoResto?: (cantidadGrupos: number) => string;
  /** Ranking: antepone el puesto (#1, #2…) a cada grupo. */
  numerado?: boolean;
};

export function GraficoBarras({
  titulo,
  descripcion,
  datos,
  total,
  limite,
  textoResto,
  numerado = false,
}: Props) {
  const visibles = limite ? datos.slice(0, limite) : datos;
  const resto = datos.slice(visibles.length);
  const operacionesResto = resto.reduce((suma, dato) => suma + dato.cantidad, 0);
  // Los datos vienen de mayor a menor: el primero es el más grande.
  const maximo = Math.max(...visibles.map((dato) => dato.cantidad), 1);

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

      {visibles.map((dato, indice) => {
        const porcentaje = textoPorcentaje(dato.cantidad, total);
        const puesto = numerado ? `Puesto ${indice + 1}, ` : '';
        return (
          <View
            key={dato.etiqueta}
            style={estilos.grupo}
            accessible
            accessibilityLabel={`${puesto}${dato.etiqueta}: ${textoOperaciones(dato.cantidad)}, ${porcentaje} del total`}
          >
            {/* Con letra grande, el número pasa debajo de la etiqueta en vez de cortarla. */}
            <View style={estilos.fila}>
              <Text variant="bodyMedium" style={estilos.etiqueta}>
                {numerado ? <Text style={estilos.puesto}>{`#${indice + 1}  `}</Text> : null}
                {dato.etiqueta}
              </Text>
              <Text variant="bodyMedium" style={estilos.cantidad}>
                {`${dato.cantidad} · ${porcentaje}`}
              </Text>
            </View>
            <View style={estilos.pista}>
              <View style={[estilos.barra, { width: `${(dato.cantidad / maximo) * 100}%` }]} />
            </View>
          </View>
        );
      })}

      {resto.length > 0 ? (
        <Text variant="bodySmall" style={estilos.descripcion}>
          {`${textoResto ? textoResto(resto.length) : `Y ${resto.length} más`}: ${textoOperaciones(operacionesResto)}, ${textoPorcentaje(operacionesResto, total)} del total.`}
        </Text>
      ) : null}
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
  grupo: { gap: espacio.xs },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: espacio.s,
  },
  etiqueta: { flexShrink: 1, color: colores.texto },
  puesto: { color: colores.primario, fontFamily: fuentes.negrita },
  cantidad: { color: colores.primario, fontFamily: fuentes.seminegrita },
  pista: {
    height: espacio.s,
    borderRadius: espacio.xs,
    backgroundColor: colores.superficieVariante,
    overflow: 'hidden',
  },
  barra: { height: '100%', borderRadius: espacio.xs, backgroundColor: colores.primario },
});
