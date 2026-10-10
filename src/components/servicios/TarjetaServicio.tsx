/**
 * EJEMPLO DE REFERENCIA de un componente de módulo.
 * HU-01 (UI) lo rediseña según el mockup.
 */
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import { acentoServicio, colores, espacio, radio } from '@/theme';
import type { Servicio } from '@/types';

export function TarjetaServicio({ servicio }: { servicio: Servicio }) {
  const acento = acentoServicio[servicio.categoria];

  return (
    <Card mode="contained" style={[estilos.tarjeta, { borderLeftColor: acento }]}>
      <Card.Content style={estilos.contenido}>
        <Text variant="titleMedium" style={estilos.nombre}>
          {servicio.nombre}
        </Text>
        <Text variant="bodyMedium" style={estilos.descripcion}>
          {servicio.descripcion}
        </Text>
        <Dato icono="account-group-outline" texto={servicio.publico} />
        <Dato icono="clock-outline" texto={servicio.horario} />
        <Dato icono="information-outline" texto={servicio.formaSolicitud} />
        {servicio.requiereCuenta ? (
          <Text variant="labelMedium" style={[estilos.cuenta, { color: acento }]}>
            Requiere cuenta institucional
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

function Dato({ icono, texto }: { icono: string; texto: string }) {
  return (
    <View style={estilos.dato}>
      <Icon source={icono} size={16} color={colores.textoSecundario} />
      <Text variant="bodySmall" style={estilos.textoDato}>
        {texto}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.tarjeta,
    borderLeftWidth: 4,
  },
  contenido: { gap: espacio.s },
  nombre: { color: colores.texto, fontWeight: '700' },
  descripcion: { color: colores.texto },
  dato: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textoDato: { flex: 1, color: colores.textoSecundario },
  cuenta: { marginTop: espacio.xs },
});
