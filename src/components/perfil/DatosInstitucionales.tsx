/**
 * Datos institucionales del perfil (HU-06, CA1 y CA2): vienen de la cuenta de la universidad
 * y se muestran como una lista de texto, sin campos: no hay nada que editar (solo lectura).
 */
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Perfil } from '@/types';
import { describirRoles, esPersonal, NOMBRE_TIPO } from '@/utils/roles';

export function DatosInstitucionales({ perfil }: { perfil: Perfil }) {
  const datos: { etiqueta: string; valor: string }[] = [
    { etiqueta: 'Correo institucional', valor: perfil.correo },
    { etiqueta: 'Tipo de usuario', valor: NOMBRE_TIPO[perfil.tipo] },
  ];
  if (esPersonal(perfil)) datos.push({ etiqueta: 'Roles del personal', valor: describirRoles(perfil) });
  if (perfil.programa) datos.push({ etiqueta: 'Programa o dependencia', valor: perfil.programa });
  if (perfil.semestre) datos.push({ etiqueta: 'Semestre', valor: `${perfil.semestre}.º` });

  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        Datos institucionales
      </Text>
      <Text variant="bodySmall" style={estilos.nota}>
        Vienen de tu cuenta de la universidad; no se pueden cambiar aquí.
      </Text>
      {datos.map((dato, i) => (
        <View key={dato.etiqueta}>
          {i > 0 ? <Divider /> : null}
          <View
            style={estilos.fila}
            accessible
            accessibilityLabel={`${dato.etiqueta}: ${dato.valor}. Solo lectura`}
          >
            <Text variant="labelMedium" style={estilos.etiqueta}>
              {dato.etiqueta}
            </Text>
            <Text variant="bodyLarge" style={estilos.valor}>
              {dato.valor}
            </Text>
          </View>
        </View>
      ))}
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
  nota: { color: colores.textoSecundario },
  fila: { gap: espacio.xs, paddingVertical: espacio.s },
  etiqueta: { color: colores.textoSecundario },
  valor: { color: colores.texto },
});
