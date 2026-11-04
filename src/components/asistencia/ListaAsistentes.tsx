/**
 * Quiénes registraron su asistencia y el total (HU-33, CA2), del primero al último. Cada uno dice
 * a qué hora llegó y si fue con el QR o marcado a mano (CA3), con ícono y texto.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { RegistroAsistencia } from '@/types';

const MEDIO = {
  qr: { icono: 'qrcode', texto: 'Con QR' },
  manual: { icono: 'hand-back-right-outline', texto: 'A mano' },
} as const;

type Props = {
  registros: RegistroAsistencia[];
  total: number;
};

export function ListaAsistentes({ registros, total }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        {total === 1 ? '1 asistente' : `${total} asistentes`}
      </Text>

      {registros.length === 0 ? (
        <Text variant="bodyMedium" style={estilos.secundario}>
          Todavía nadie se ha registrado.
        </Text>
      ) : (
        registros.map((registro) => {
          const medio = MEDIO[registro.medio];
          const hora = registro.fechaHora.split(' ')[1] ?? '';
          return (
            <View
              key={registro.id}
              style={estilos.fila}
              accessible
              accessibilityLabel={`${registro.nombre}, a las ${hora}, ${medio.texto.toLowerCase()}`}
            >
              <View style={estilos.textos}>
                <Text variant="bodyLarge" style={estilos.nombre}>
                  {registro.nombre}
                </Text>
                <Text variant="bodySmall" style={estilos.secundario}>
                  {`A las ${hora}`}
                </Text>
              </View>
              <View style={estilos.medio}>
                <Icon source={medio.icono} size={16} color={colores.primarioOscuro} />
                <Text variant="labelMedium" style={estilos.textoMedio}>
                  {medio.texto}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
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
  secundario: { color: colores.textoSecundario },
  // Con letra grande, la etiqueta del medio pasa debajo del nombre.
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
    paddingVertical: espacio.xs,
  },
  textos: { flexShrink: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  medio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoMedio: { color: colores.primarioOscuro, fontFamily: fuentes.seminegrita },
});
