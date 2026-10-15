/**
 * Datos institucionales del perfil (HU-06, CA1 y CA2): vienen de la cuenta de la
 * universidad y se muestran solo en lectura, con candado.
 *
 * Usa editable={false} y no disabled: Paper pinta disabled al 38 % y no pasa el contraste AA.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TextInput } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Perfil } from '@/types';
import { NOMBRE_ROL } from '@/utils/roles';

export function DatosInstitucionales({ perfil }: { perfil: Perfil }) {
  const campos: { etiqueta: string; valor: string }[] = [
    { etiqueta: 'Nombre', valor: perfil.nombre },
    { etiqueta: 'Correo institucional', valor: perfil.correo },
    { etiqueta: 'Rol', valor: NOMBRE_ROL[perfil.rol] },
  ];
  if (perfil.programa) campos.push({ etiqueta: 'Programa o dependencia', valor: perfil.programa });
  if (perfil.semestre) campos.push({ etiqueta: 'Semestre', valor: `${perfil.semestre}.º` });

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Icon source="check-decagram-outline" size={24} color={colores.primario} />
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          Datos institucionales
        </Text>
      </View>
      <Text variant="bodySmall" style={estilos.nota}>
        Vienen de tu cuenta de la universidad; no se pueden cambiar aquí.
      </Text>
      {campos.map((campo) => (
        <TextInput
          key={campo.etiqueta}
          mode="outlined"
          label={campo.etiqueta}
          value={campo.valor}
          editable={false}
          right={<TextInput.Icon icon="lock-outline" accessible={false} importantForAccessibility="no" />}
          accessibilityLabel={`${campo.etiqueta}: ${campo.valor}. Solo lectura`}
        />
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
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  nota: { color: colores.textoSecundario },
});
