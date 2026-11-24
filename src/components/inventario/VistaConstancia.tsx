/**
 * La constancia del préstamo de una tablet (HU-23, #253), en el orden del formato de
 * responsabilidad de la biblioteca: fechas, usuario, dispositivo, estado del equipo, quién
 * entregó y quién recibió, y las tres notas. Si se sabe, dice cuándo aceptó la persona el
 * formato en la app.
 * Firmas (#310): el trazo del usuario si firmó en la pantalla; quien entrega y quien recibe firman
 * con la firma registrada en su Perfil o, sin ella, con su sesión, como en el PDF (#317). Sin firma
 * del usuario en la pantalla, se avisa que el PDF trae el recuadro para firmar a mano.
 * Fuera del borrador, el código de verificación, el mismo del PDF.
 * Solo muestra: la constancia la arma constanciaDe() (o la API) y llega por props.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

import { colores, espacio, fuentes, radio } from '@/theme';
import {
  codigoVerificacion,
  esFirmaValida,
  fechaHoraLegible,
  type ConstanciaPrestamo,
  type DatoConstancia,
} from '@/utils/prestamos';

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
  const usuario: DatoConstancia[] = constancia.aceptoEl
    ? [
        ...constancia.usuario,
        { etiqueta: 'Aceptó el formato en la app', valor: fechaHoraLegible(constancia.aceptoEl) },
      ]
    : constancia.usuario;
  // Lo mismo que el PDF: con la firma registrada si la tiene; si no, con su sesión y la hora.
  const comoFirmo = (
    nombre: string | undefined,
    fechaHora: string | undefined,
    firmaRegistrada: ConstanciaPrestamo['firmaEntrega'],
  ) => {
    if (!nombre) return 'Pendiente';
    if (fechaHora && esFirmaValida(firmaRegistrada)) {
      return `${nombre}, con la firma registrada en su Perfil`;
    }
    return `${nombre}${fechaHora ? `, con su sesión el ${fechaHoraLegible(fechaHora)}` : ''}`;
  };
  const responsables: DatoConstancia[] = [
    {
      etiqueta: 'Entregó',
      valor: comoFirmo(constancia.entrego, constancia.entregadaEl, constancia.firmaEntrega),
    },
    {
      etiqueta: 'Recibió la devolución',
      valor: comoFirmo(constancia.recibio, constancia.recibidaEl, constancia.firmaRecibe),
    },
  ];
  const firma = esFirmaValida(constancia.firmaUsuario) ? constancia.firmaUsuario : null;

  return (
    <View style={estilos.constancia}>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        {borrador ? 'Constancia del préstamo (antes de entregar)' : 'Constancia del préstamo'}
      </Text>
      <Grupo titulo="Fechas" datos={fechas} />
      <Grupo titulo="Usuario" datos={usuario} />
      <Grupo titulo="Dispositivo" datos={constancia.dispositivo} />
      <Grupo titulo="Estado del equipo" datos={estado} />
      <Grupo titulo="Responsables" datos={responsables} />
      {firma ? (
        <View style={estilos.grupo}>
          <Text variant="titleSmall" style={estilos.subtitulo} accessibilityRole="header">
            Firma del usuario responsable
          </Text>
          <View
            style={estilos.firma}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Firma electrónica del usuario, hecha el ${fechaHoraLegible(firma.fechaHora)}`}
          >
            <Svg width="100%" height="100%" viewBox={`0 0 ${firma.ancho} ${firma.alto}`}>
              <Path
                d={firma.trazo}
                stroke={colores.texto}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
          <Text variant="bodySmall" style={estilos.nota}>
            {`Firmada electrónicamente en la app el ${fechaHoraLegible(firma.fechaHora)}.`}
          </Text>
        </View>
      ) : borrador ? null : (
        <Text variant="bodySmall" style={estilos.nota}>
          El usuario firmó en papel: comparte el PDF e imprímelo, trae el recuadro para firmar a
          mano.
        </Text>
      )}
      {borrador || !codigoVerificacion(constancia) ? null : (
        <Text variant="bodySmall" style={estilos.nota}>
          {`Código de verificación: ${codigoVerificacion(constancia)}`}
        </Text>
      )}

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
        // Sin flexWrap: en una fila que se envuelve, un valor de dos líneas («ANDRÉS MEJÍA») medía
        // mal su alto y pisaba la fila de abajo. La etiqueta y el valor bajan de línea cada uno.
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
  dato: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  etiqueta: { flexBasis: '40%', flexShrink: 0, color: colores.textoSecundario },
  valor: { flex: 1, color: colores.texto },
  nota: { color: colores.textoSecundario },
  // La firma, del ancho de la tarjeta y con el alto proporcional al panel donde se hizo.
  firma: {
    width: '100%',
    aspectRatio: 2.4,
    borderBottomWidth: 1,
    borderBottomColor: colores.texto,
  },
});
