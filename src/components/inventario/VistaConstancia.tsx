/**
 * La constancia del préstamo de una tablet (HU-23, #253), en el orden del formato de
 * responsabilidad de la biblioteca: fechas, usuario, dispositivo, estado del equipo, quién
 * entregó y quién recibió, y las tres notas. Las firmas del papel son quién hizo cada paso.
 * Solo muestra: la constancia la arma constanciaDe() (o la API) y llega por props.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaHoraLegible, type ConstanciaPrestamo, type DatoConstancia } from '@/utils/prestamos';

type Props = {
  constancia: ConstanciaPrestamo;
  /** Antes de confirmar la entrega: aún no hay devolución, así que la fecha es la hora límite. */
  borrador?: boolean;
};

export function VistaConstancia({ constancia, borrador = false }: Props) {
  const fechas: DatoConstancia[] = [
    { etiqueta: 'Préstamo', valor: fechaHoraLegible(constancia.prestamo) },
    {
      etiqueta: constancia.recibio ? 'Devolución' : 'Devolver a más tardar',
      valor: fechaHoraLegible(constancia.devolucion),
    },
  ];
  const estado: DatoConstancia[] = [
    { etiqueta: 'Estado', valor: constancia.estadoEquipo },
    ...(constancia.notas ? [{ etiqueta: 'Notas', valor: constancia.notas }] : []),
  ];
  const responsables: DatoConstancia[] = [
    { etiqueta: 'Entregó', valor: constancia.entrego ?? 'Pendiente' },
    { etiqueta: 'Recibió la devolución', valor: constancia.recibio ?? 'Pendiente' },
  ];

  return (
    <View style={estilos.constancia}>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        {borrador ? 'Constancia del préstamo (antes de entregar)' : 'Constancia del préstamo'}
      </Text>
      <Grupo titulo="Fechas" datos={fechas} />
      <Grupo titulo="Usuario" datos={constancia.usuario} />
      <Grupo titulo="Dispositivo" datos={constancia.dispositivo} />
      <Grupo titulo="Estado del equipo" datos={estado} />
      <Grupo titulo="Responsables" datos={responsables} />

      <View style={estilos.grupo}>
        <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
          Notas
        </Text>
        {constancia.notasLegales.map((nota, indice) => (
          <Text key={nota} variant="bodySmall" style={estilos.nota}>
            {`${indice + 1}. ${nota}`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Grupo({ titulo, datos }: { titulo: string; datos: DatoConstancia[] }) {
  return (
    <View style={estilos.grupo}>
      <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
        {titulo}
      </Text>
      {datos.map((dato) => (
        // Con letra grande, el valor pasa debajo de la etiqueta en vez de cortarse.
        <View key={dato.etiqueta} style={estilos.dato} accessible accessibilityLabel={`${dato.etiqueta}: ${dato.valor}`}>
          <Text variant="bodySmall" style={estilos.etiqueta}>
            {dato.etiqueta}
          </Text>
          <Text variant="bodyMedium" style={estilos.valor}>
            {dato.valor}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  constancia: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  grupo: { gap: espacio.xs },
  subtitulo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  dato: { flexDirection: 'row', flexWrap: 'wrap', columnGap: espacio.s },
  etiqueta: { minWidth: 120, color: colores.textoSecundario },
  valor: { flexShrink: 1, color: colores.texto },
  nota: { color: colores.textoSecundario },
});
