import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import Svg, { Circle, Line, Polyline, Rect, Text as TextoSvg } from 'react-native-svg';

import { usePreferenciaGrafica, type TipoGrafica } from '@/hooks/usePreferenciaGrafica';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { ConteoIndicador } from '@/types';
import { textoPorcentaje } from '@/utils/filtrosEstadisticas';

type Dato = ConteoIndicador & { color?: string };
type Props = {
  clave?: string;
  titulo: string;
  descripcion?: string;
  datos: Dato[];
  total?: number;
  recomendada?: TipoGrafica;
  selector?: ReactNode;
  limite?: number;
  numerado?: boolean;
  textoResto?: (cantidad: number) => string;
  nombreAccesible?: (etiqueta: string) => string;
  sustantivo?: string;
};

const TIPOS = {
  dona: { icono: 'chart-donut', etiqueta: 'Gráfica de dona' },
  lineas: { icono: 'chart-line', etiqueta: 'Gráfica de líneas' },
  barras: { icono: 'chart-bar', etiqueta: 'Barras horizontales' },
} as const;
const PALETA = [
  colores.primarioOscuro,
  colores.verdeUpc,
  coloresEstado.realizada.texto,
  colores.textoSecundario,
  colores.primario,
];
function colorDe(dato: Dato, i: number) {
  return dato.color ?? PALETA[i % PALETA.length];
}

export function GraficaIndicador({
  clave,
  titulo,
  descripcion,
  datos,
  total = datos.reduce((suma, dato) => suma + dato.cantidad, 0),
  recomendada = 'barras',
  selector,
  limite,
  numerado,
  textoResto,
  nombreAccesible = (etiqueta) => etiqueta,
  sustantivo,
}: Props) {
  const id = clave ?? titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { tipo, elegir } = usePreferenciaGrafica(id, recomendada);
  const opciones = recomendada === 'barras' ? [] : ([recomendada, 'barras'] as const);
  const visibles = limite ? datos.slice(0, limite) : datos;
  const maximo = Math.max(...visibles.map((dato) => dato.cantidad), 1);
  const resto = datos.slice(visibles.length);
  const cantidadTexto = (valor: number) => valor.toLocaleString('es-CO');
  const resumen =
    titulo +
    ': ' +
    (datos.length
      ? datos
          .map(
            (dato) =>
              nombreAccesible(dato.etiqueta) +
              ', ' +
              cantidadTexto(dato.cantidad) +
              ' (' +
              textoPorcentaje(dato.cantidad, total) +
              ')',
          )
          .join('; ')
      : 'sin datos');

  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleMedium" accessibilityRole="header" style={estilos.titulo}>
        {titulo}
      </Text>
      {descripcion ? (
        <Text variant="bodySmall" style={estilos.descripcion}>
          {descripcion}
        </Text>
      ) : null}
      {selector}
      {datos.length > 0 && opciones.length > 0 ? (
        <View style={estilos.opciones}>
          {opciones.map((opcion) => (
            <IconButton
              key={opcion}
              icon={TIPOS[opcion].icono}
              mode={tipo === opcion ? 'contained-tonal' : 'outlined'}
              size={20}
              style={estilos.opcion}
              onPress={() => void elegir(opcion)}
              accessibilityLabel={TIPOS[opcion].etiqueta + ' para ' + titulo}
              accessibilityRole="radio"
              accessibilityState={{ checked: tipo === opcion }}
            />
          ))}
        </View>
      ) : null}
      <View accessible accessibilityLabel={resumen} style={estilos.lista}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={estilos.lista}
        >
          {datos.length === 0 ? <Text style={estilos.descripcion}>Sin datos</Text> : null}
          {datos.length > 0 && tipo === 'dona' ? <Dona datos={visibles} /> : null}
          {datos.length > 0 && tipo === 'lineas' ? <Lineas datos={visibles} /> : null}
          {visibles.map((dato, i) => (
            <View key={dato.etiqueta} style={estilos.grupo}>
              <View style={estilos.fila}>
                <Text style={estilos.etiqueta}>
                  {tipo !== 'barras' || numerado ? String(i + 1) + '. ' : ''}
                  {nombreAccesible(dato.etiqueta)}
                </Text>
                <Text style={estilos.cantidad}>
                  {cantidadTexto(dato.cantidad)}
                  {sustantivo ? ' ' + sustantivo : ''} · {textoPorcentaje(dato.cantidad, total)}
                </Text>
              </View>
              {tipo === 'barras' ? (
                <BarraHorizontal proporcion={dato.cantidad / maximo} color={colorDe(dato, i)} />
              ) : null}
            </View>
          ))}
          {resto.length > 0 ? (
            <Text style={estilos.descripcion}>
              {textoResto?.(resto.length) ?? 'Y ' + resto.length + ' más'} ·{' '}
              {cantidadTexto(resto.reduce((suma, dato) => suma + dato.cantidad, 0))}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function BarraHorizontal({ proporcion, color }: { proporcion: number; color: string }) {
  return (
    <Svg width="100%" height={10} viewBox="0 0 100 10" preserveAspectRatio="none">
      <Rect width={100} height={10} fill={colores.superficieVariante} />
      <Rect width={100 * proporcion} height={10} fill={color} />
    </Svg>
  );
}

function Dona({ datos }: { datos: Dato[] }) {
  const radio = 56;
  const perimetro = 2 * Math.PI * radio;
  const suma = datos.reduce((total, dato) => total + dato.cantidad, 0);
  let acumulado = 0;
  return (
    <Svg width="100%" height={170} viewBox="0 0 180 170">
      <Circle
        cx={90}
        cy={85}
        r={radio}
        fill="none"
        stroke={colores.superficieVariante}
        strokeWidth={24}
      />
      {suma > 0
        ? datos.map((dato, i) => {
            if (dato.cantidad <= 0) return null;
            const inicio = acumulado;
            const parte = dato.cantidad / suma;
            acumulado += parte;
            const arco = perimetro * parte;
            const angulo = (inicio + parte / 2) * Math.PI * 2 - Math.PI / 2;
            return (
              <GrupoArco
                key={dato.etiqueta}
                arco={arco}
                perimetro={perimetro}
                inicio={inicio}
                radio={radio}
                angulo={angulo}
                numero={i + 1}
                color={colorDe(dato, i)}
              />
            );
          })
        : null}
    </Svg>
  );
}

function GrupoArco({
  arco,
  perimetro,
  inicio,
  radio,
  angulo,
  numero,
  color,
}: {
  arco: number;
  perimetro: number;
  inicio: number;
  radio: number;
  angulo: number;
  numero: number;
  color: string;
}) {
  return (
    <>
      <Circle
        cx={90}
        cy={85}
        r={radio}
        fill="none"
        stroke={color}
        strokeWidth={24}
        strokeDasharray={[Math.max(0, arco - 1), perimetro]}
        strokeDashoffset={-inicio * perimetro}
        transform="rotate(-90 90 85)"
      />
      {arco > 24 ? (
        <TextoSvg
          x={90 + Math.cos(angulo) * 76}
          y={89 + Math.sin(angulo) * 76}
          textAnchor="middle"
          fontSize={11}
          fill={colores.texto}
        >
          {numero}
        </TextoSvg>
      ) : null}
    </>
  );
}

function Lineas({ datos }: { datos: Dato[] }) {
  const maximo = Math.max(1, ...datos.map((dato) => dato.cantidad));
  const puntos = datos.map(({ cantidad }, i) => ({
    x: datos.length === 1 ? 160 : 14 + (292 * i) / (datos.length - 1),
    y: 112 - (cantidad / maximo) * 88,
  }));
  return (
    <Svg width="100%" height={140} viewBox="0 0 320 140">
      <Line x1={14} x2={306} y1={112} y2={112} stroke={colores.bordeFuerte} />
      <Polyline
        points={puntos.map(({ x, y }) => x + ',' + y).join(' ')}
        fill="none"
        stroke={colores.primarioOscuro}
        strokeWidth={3}
      />
      {puntos.map(({ x, y }, i) => (
        <Circle key={i} cx={x} cy={y} r={4} fill={colores.primarioOscuro} />
      ))}
      {puntos.length <= 12
        ? puntos.map(({ x }, i) => (
            <TextoSvg key={i} x={x} y={132} textAnchor="middle" fontSize={10} fill={colores.texto}>
              {i + 1}
            </TextoSvg>
          ))
        : null}
    </Svg>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  opcion: { width: 44, height: 44, margin: 0 },
  lista: { gap: espacio.s },
  grupo: { gap: espacio.xs },
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: espacio.xs,
  },
  etiqueta: { flexShrink: 1, color: colores.texto },
  cantidad: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
