/**
 * Afluencia semanal del Dashboard (#306), como en el mockup: el promedio de operaciones por día,
 * de lunes a sábado, en las últimas semanas. Sin paquete de gráficos: cada columna es un View con
 * la altura proporcional al día con más uso, con su número encima y la inicial del día debajo. El
 * día de más uso va en verde oscuro y dice «Pico», así no depende solo del color. No hay aforo en
 * tiempo real: son las operaciones que registra la app.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Afluencia } from '@/utils/panel';

/** Alto del área de las columnas. */
const ALTO = espacio.xl * 3;

/** 0,4 → "0,4"; 2 → "2". */
const numero = (valor: number) => String(valor).replace('.', ',');

export function AfluenciaSemanal({ afluencia }: { afluencia: Afluencia }) {
  const maximo = Math.max(...afluencia.dias.map((dia) => dia.promedio), 0.1);
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          Afluencia semanal
        </Text>
        <Text variant="bodySmall" style={estilos.descripcion}>
          {`Operaciones por día, en promedio, en las últimas ${afluencia.semanas} semanas`}
        </Text>
      </View>

      {afluencia.pico == null ? (
        <Text variant="bodyMedium" style={estilos.descripcion}>
          {`Todavía no hay operaciones en las últimas ${afluencia.semanas} semanas.`}
        </Text>
      ) : (
        <>
          <View style={estilos.columnas}>
            {afluencia.dias.map((dia) => {
              const esPico = dia.nombre === afluencia.pico;
              return (
                <View
                  key={dia.nombre}
                  style={estilos.columna}
                  accessible
                  accessibilityLabel={`${dia.nombre}: ${numero(dia.promedio)} operaciones por semana${esPico ? ', el día de más uso' : ''}`}
                >
                  {esPico ? (
                    <Text variant="labelSmall" style={estilos.pico}>
                      Pico
                    </Text>
                  ) : null}
                  <Text variant="labelLarge" style={estilos.numero}>
                    {numero(dia.promedio)}
                  </Text>
                  <View
                    style={[
                      estilos.barra,
                      {
                        height: Math.max((dia.promedio / maximo) * ALTO, espacio.xs),
                        backgroundColor: esPico ? colores.primarioOscuro : colores.primario,
                      },
                    ]}
                  />
                  <Text variant="labelMedium" style={estilos.dia}>
                    {dia.corto}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`El día de más uso es el ${afluencia.pico}.`}
          </Text>
        </>
      )}
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
  dia: { color: colores.textoSecundario },
  texto: { color: colores.texto },
});
