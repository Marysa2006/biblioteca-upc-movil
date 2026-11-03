/**
 * Una operación registrada (HU-25): servicio, estado, quién, de qué tipo y programa, para qué,
 * cuándo y con qué modalidad (CA1). Lo que falta se ve como "No informado", en texto (CA2).
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { NO_INFORMADO, type EstadoUso, type RegistroUso } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { NOMBRE_ESTADO_USO, NOMBRE_SERVICIO, NOMBRE_TIPO_USUARIO } from '@/utils/estadisticas';

const TEXTO_NO_INFORMADO = 'No informado';

const NOMBRE_MODALIDAD: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
};

/** Colores de las etiquetas de solicitud: completada va en verde, como Aprobada. */
const COLORES_ESTADO: Record<EstadoUso, { fondo: string; texto: string }> = {
  completada: coloresEstado.aprobada,
  pendiente: coloresEstado.pendiente,
  cancelada: coloresEstado.cancelada,
};

/** El dato tal cual, su nombre legible o "No informado"; nunca vacío. */
function dato(valor: string | undefined, tabla?: Record<string, string>): string {
  if (!valor || valor === NO_INFORMADO) return TEXTO_NO_INFORMADO;
  return tabla?.[valor] ?? valor;
}

/** "2 de octubre", o "2 de octubre al 5 de octubre" si la operación abarca varios días. */
function fechas(registro: RegistroUso): string {
  const inicio = fechaLegible(registro.fecha);
  if (!registro.fechaFin || registro.fechaFin === registro.fecha) return inicio;
  return `${inicio} al ${fechaLegible(registro.fechaFin)}`;
}

export function TarjetaRegistro({ registro }: { registro: RegistroUso }) {
  const servicio = NOMBRE_SERVICIO[registro.servicio] ?? registro.servicio;
  const estado = NOMBRE_ESTADO_USO[registro.estado] ?? registro.estado;
  const color = COLORES_ESTADO[registro.estado] ?? coloresEstado.cancelada;
  const filas: [string, string][] = [
    ['Usuario', dato(registro.nombre)],
    ['Tipo', dato(registro.tipoUsuario, NOMBRE_TIPO_USUARIO)],
    ['Programa', dato(registro.programa)],
    ['Finalidad', dato(registro.finalidad)],
    ['Fecha', fechas(registro)],
    ['Modalidad', dato(registro.modalidad, NOMBRE_MODALIDAD)],
  ];

  return (
    <View
      style={estilos.tarjeta}
      accessible
      accessibilityLabel={[`${servicio}, ${estado}`, ...filas.map(([campo, valor]) => `${campo}: ${valor}`)].join('. ')}
    >
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.servicio}>
          {servicio}
        </Text>
        <View style={[estilos.estado, { backgroundColor: color.fondo }]}>
          <Text variant="labelMedium" style={{ color: color.texto }}>
            {estado}
          </Text>
        </View>
      </View>
      {filas.map(([campo, valor]) => (
        <View key={campo} style={estilos.fila}>
          <Text variant="bodySmall" style={estilos.campo}>
            {campo}
          </Text>
          <Text
            variant="bodyMedium"
            style={valor === TEXTO_NO_INFORMADO ? estilos.noInformado : estilos.valor}
          >
            {valor}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, marginBottom: espacio.xs },
  servicio: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  estado: { paddingHorizontal: espacio.s, paddingVertical: espacio.xs, borderRadius: radio.boton },
  // Con letra grande, el valor pasa debajo del campo en vez de cortarse.
  fila: { flexDirection: 'row', flexWrap: 'wrap', columnGap: espacio.s },
  campo: { width: 84, color: colores.textoSecundario },
  valor: { flexShrink: 1, color: colores.texto },
  noInformado: { flexShrink: 1, color: colores.textoSecundario, fontStyle: 'italic' },
});
