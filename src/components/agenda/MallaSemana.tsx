/**
 * Malla horaria de la semana de la agenda (HU-15, CA1), como un calendario por horas: una
 * columna por día (de lunes a sábado), una fila por hora y cada cita como un bloque cuya
 * posición es su hora de inicio y su alto, su duración. Las citas simultáneas se reparten en
 * columnas paralelas (distribuirCitas).
 *
 * En el celular se ven 3 días a la vez y se desliza de lado, día por día. La malla tiene su
 * propio deslizamiento vertical: el encabezado de los días queda fijo arriba y la columna de
 * las horas, fija a la izquierda (se mueve con la malla gracias a scrollTo de Reanimated).
 * Tocar un día del encabezado abre ese día en la vista Hoy; tocar una cita abre su detalle.
 * Los días sin atención (domingo, festivos) se ven grises y lo dicen con texto.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import {
  aMinutos,
  citasDelDia,
  distribuirCitas,
  textoCitas,
  type RangoMalla,
} from '@/utils/agenda';
import { abreviaturaDia, fechaCompleta, numeroDia } from '@/utils/calendario';

import { BloqueCita } from './BloqueCita';

/** Alto de una hora (px): una cita de 30 minutos deja dos líneas legibles. */
const ALTO_HORA = 96;
/** Ancho de la columna de las horas (px). */
const ANCHO_HORAS = 48;
/** Días que se ven a la vez; los demás, deslizando de lado. */
const DIAS_VISIBLES = 3;
/** La malla ocupa como mucho esta parte del alto de la pantalla; el resto se desliza dentro. */
const PARTE_DE_LA_PANTALLA = 0.6;
/** Separación entre bloques (px), para que dos citas seguidas no se peguen. */
const SEPARACION_BLOQUES = 2;
/** Cada cuánto se mueve la línea de la hora actual. */
const MINUTO_MS = 60_000;

type Props = {
  /** Los días de la semana que se muestran, en orden. */
  dias: string[];
  hoy: string;
  citas: Cita[];
  rango: RangoMalla;
  mostrarFacilitador: boolean;
  /** Por qué un día no tiene atención, o null si la tiene. */
  motivoCerrado: (fecha: string) => string | null;
  onAbrir: (cita: Cita) => void;
  onElegirDia: (fecha: string) => void;
};

const dos = (n: number) => String(n).padStart(2, '0');

export function MallaSemana({
  dias,
  hoy,
  citas,
  rango,
  mostrarFacilitador,
  motivoCerrado,
  onAbrir,
  onElegirDia,
}: Props) {
  const ventana = useWindowDimensions();
  const [ancho, setAncho] = useState(0);
  const [altoEncabezado, setAltoEncabezado] = useState(0);
  const anchoDia = Math.max((ancho - ANCHO_HORAS) / DIAS_VISIBLES, 0);

  const horas = Array.from(
    { length: (rango.fin - rango.inicio) / 60 },
    (_, i) => rango.inicio / 60 + i,
  );
  const altoTotal = horas.length * ALTO_HORA;
  const altoVisible = Math.min(altoTotal, ventana.height * PARTE_DE_LA_PANTALLA);
  const aAlto = (minutos: number) => ((minutos - rango.inicio) / 60) * ALTO_HORA;

  // La línea de la hora actual se mueve cada minuto.
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), MINUTO_MS);
    return () => clearInterval(intervalo);
  }, []);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const muestraAhora = minutosAhora >= rango.inicio && minutosAhora <= rango.fin;

  // La columna de las horas sigue el deslizamiento vertical de la malla.
  const refHoras = useAnimatedRef<Animated.ScrollView>();
  const alDeslizar = useAnimatedScrollHandler({
    onScroll: (evento) => {
      scrollTo(refHoras, 0, evento.contentOffset.y, false);
    },
  });

  // Al abrir la semana, la malla arranca en hoy si está en ella.
  const refDias = useRef<ScrollViewInstance>(null);
  const indiceHoy = dias.indexOf(hoy);
  const alMedirDias = () => {
    if (indiceHoy > 0) {
      const ultimoInicio = Math.max(dias.length - DIAS_VISIBLES, 0);
      refDias.current?.scrollTo({
        x: Math.min(indiceHoy, ultimoInicio) * anchoDia,
        animated: false,
      });
    }
  };

  return (
    <View style={estilos.malla} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
      {anchoDia > 0 ? (
        <View style={estilos.fila}>
          {/* Columna fija de las horas. Es visual: cada bloque ya dice su hora al lector. */}
          <View
            style={estilos.columnaHoras}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <View style={[estilos.esquina, { height: altoEncabezado }]} />
            <Animated.ScrollView
              ref={refHoras}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              style={{ height: altoVisible }}
            >
              <View style={{ height: altoTotal }}>
                {horas.map((hora, i) => (
                  <Text
                    key={hora}
                    variant="labelSmall"
                    style={[estilos.hora, { top: i * ALTO_HORA }]}
                  >
                    {`${dos(hora)}:00`}
                  </Text>
                ))}
              </View>
            </Animated.ScrollView>
          </View>

          <ScrollView
            ref={refDias}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={anchoDia}
            decelerationRate="fast"
            onContentSizeChange={alMedirDias}
          >
            <View>
              {/* Encabezado de los días: fijo arriba mientras la malla se desliza. */}
              <View
                style={estilos.encabezado}
                onLayout={(e) => setAltoEncabezado(e.nativeEvent.layout.height)}
              >
                {dias.map((fecha) => {
                  const esHoy = fecha === hoy;
                  const cerrado = motivoCerrado(fecha);
                  const delDia = citasDelDia(citas, fecha).length;
                  return (
                    <TouchableRipple
                      key={fecha}
                      onPress={() => onElegirDia(fecha)}
                      style={[estilos.dia, { width: anchoDia }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${fechaCompleta(fecha)}${esHoy ? ', hoy' : ''}, ${cerrado ? `sin atención: ${cerrado}` : textoCitas(delDia)}. Ver el día`}
                    >
                      <View style={estilos.contenidoDia}>
                        <Text
                          variant="labelMedium"
                          style={esHoy ? estilos.nombreDiaHoy : estilos.nombreDia}
                        >
                          {abreviaturaDia(fecha)}
                        </Text>
                        <View style={[estilos.numero, esHoy && estilos.numeroHoy]}>
                          <Text
                            variant="titleMedium"
                            style={esHoy ? estilos.textoNumeroHoy : estilos.textoNumero}
                          >
                            {numeroDia(fecha)}
                          </Text>
                        </View>
                        {cerrado ? (
                          <Text variant="labelSmall" style={estilos.cerrado}>
                            Sin atención
                          </Text>
                        ) : null}
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>

              <Animated.ScrollView
                nestedScrollEnabled
                onScroll={alDeslizar}
                scrollEventThrottle={16}
                style={{ height: altoVisible }}
              >
                <View style={[estilos.cuerpo, { height: altoTotal }]}>
                  {/* Una línea por hora y otra más suave por media hora. */}
                  {horas.map((hora, i) => (
                    <Fragment key={hora}>
                      <View style={[estilos.lineaHora, { top: i * ALTO_HORA }]} />
                      <View style={[estilos.lineaMedia, { top: i * ALTO_HORA + ALTO_HORA / 2 }]} />
                    </Fragment>
                  ))}

                  {dias.map((fecha) => (
                    <View
                      key={fecha}
                      style={[
                        estilos.columnaDia,
                        { width: anchoDia },
                        motivoCerrado(fecha) ? estilos.columnaCerrada : null,
                      ]}
                    >
                      {distribuirCitas(citasDelDia(citas, fecha)).map(
                        ({ cita, columna, columnas }) => {
                          const anchoBloque = (anchoDia - SEPARACION_BLOQUES) / columnas;
                          return (
                            <BloqueCita
                              key={cita.id}
                              cita={cita}
                              posicion={{
                                top: aAlto(aMinutos(cita.horaInicio)) + SEPARACION_BLOQUES / 2,
                                height: Math.max(
                                  aAlto(aMinutos(cita.horaFin)) -
                                    aAlto(aMinutos(cita.horaInicio)) -
                                    SEPARACION_BLOQUES,
                                  ALTO_HORA / 4,
                                ),
                                left: columna * anchoBloque + SEPARACION_BLOQUES / 2,
                                width: anchoBloque - SEPARACION_BLOQUES,
                              }}
                              mostrarFacilitador={mostrarFacilitador}
                              onAbrir={onAbrir}
                            />
                          );
                        },
                      )}

                      {fecha === hoy && muestraAhora ? (
                        <View
                          style={[estilos.ahora, { top: aAlto(minutosAhora) }]}
                          importantForAccessibility="no-hide-descendants"
                          accessibilityElementsHidden
                        >
                          <View style={estilos.puntoAhora} />
                          <View style={estilos.lineaAhora} />
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Animated.ScrollView>
            </View>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/** Tamaño del punto de la línea de la hora actual (px). */
const PUNTO_AHORA = 10;

const estilos = StyleSheet.create({
  malla: {
    overflow: 'hidden',
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  fila: { flexDirection: 'row' },
  columnaHoras: { width: ANCHO_HORAS, borderRightWidth: 1, borderRightColor: colores.borde },
  esquina: { borderBottomWidth: 1, borderBottomColor: colores.borde },
  hora: {
    position: 'absolute',
    right: espacio.xs,
    marginTop: espacio.xs / 2,
    color: colores.textoSecundario,
  },
  encabezado: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  // minHeight: 44 px de área táctil; crece con la letra.
  dia: { minHeight: 44, justifyContent: 'center', paddingVertical: espacio.xs },
  contenidoDia: { alignItems: 'center', gap: espacio.xs / 2 },
  nombreDia: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  nombreDiaHoy: { color: colores.primario, fontFamily: fuentes.negrita },
  numero: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radio.boton * 2,
  },
  numeroHoy: { backgroundColor: colores.primario },
  textoNumero: { color: colores.texto, fontFamily: fuentes.seminegrita },
  textoNumeroHoy: { color: colores.superficie, fontFamily: fuentes.negrita },
  cerrado: { color: colores.textoSecundario },
  cuerpo: { flexDirection: 'row' },
  lineaHora: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colores.borde,
  },
  lineaMedia: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colores.superficieVariante,
  },
  columnaDia: { height: '100%', borderLeftWidth: 1, borderLeftColor: colores.borde },
  columnaCerrada: { backgroundColor: colores.superficieVariante },
  ahora: {
    position: 'absolute',
    left: -PUNTO_AHORA / 2,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -PUNTO_AHORA / 2,
  },
  puntoAhora: {
    width: PUNTO_AHORA,
    height: PUNTO_AHORA,
    borderRadius: PUNTO_AHORA / 2,
    backgroundColor: colores.primario,
  },
  lineaAhora: { flex: 1, height: 2, backgroundColor: colores.primario },
});
