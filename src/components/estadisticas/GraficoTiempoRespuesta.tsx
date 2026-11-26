/**
 * Tiempo de respuesta del personal por servicio (#307): de la solicitud a la primera respuesta
 * (aprobar, rechazar o proponer otra fecha), en promedio. Es la «calidad en tiempos» que pidió la
 * bibliotecóloga. Sin paquete de gráficos: cada barra es un View con el ancho proporcional al
 * servicio que más tarda, y lleva el tiempo y cuántas solicitudes entran en texto; el lector de
 * pantalla lee cada fila como una frase.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { TiempoRespuesta } from '@/types';
import { BarraHorizontal } from './GraficaIndicador';

import { textoHoras } from '@/utils/filtrosEstadisticas';

type Props = {
  datos: TiempoRespuesta[];
};

/** "de 1 solicitud" o "de 7 solicitudes". */
const textoSolicitudes = (cantidad?: number) =>
  cantidad == null ? '' : `de ${cantidad} ${cantidad === 1 ? 'solicitud' : 'solicitudes'}`;

export function GraficoTiempoRespuesta({ datos }: Props) {
  const maximo = Math.max(...datos.map((fila) => fila.horasPromedio), 1);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          Tiempo de respuesta
        </Text>
        <Text variant="bodySmall" style={estilos.descripcion}>
          Cuánto tarda el personal en responder una solicitud, en promedio
        </Text>
      </View>

      <View accessible accessibilityLabel={'Tiempo de respuesta: ' + datos.map((fila) => fila.etiqueta + ' ' + textoHoras(fila.horasPromedio)).join(', ')} style={estilos.tarjetaDatos}>
      {datos.map((fila) => (
        <View
          key={fila.servicio}
          style={estilos.fila}
          accessible
          accessibilityLabel={`${fila.etiqueta}: ${textoHoras(fila.horasPromedio)} en promedio, ${textoSolicitudes(fila.cantidad)}`}
        >
          <View style={estilos.textos}>
            <Text variant="bodyMedium" style={estilos.nombre}>
              {fila.etiqueta}
            </Text>
            <Text variant="bodyMedium" style={estilos.valor}>
              {textoHoras(fila.horasPromedio)}
            </Text>
          </View>
          <BarraHorizontal proporcion={fila.horasPromedio / maximo} color={colores.primario} />
          <Text variant="bodySmall" style={estilos.descripcion}>
            {`Promedio ${textoSolicitudes(fila.cantidad)}`}
          </Text>
        </View>
      ))}
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
  tarjetaDatos: { gap: espacio.m },
  fila: { gap: espacio.xs },
  textos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  valor: { color: colores.primarioOscuro, fontFamily: fuentes.negrita },
});
