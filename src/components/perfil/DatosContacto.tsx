/**
 * Datos de contacto del perfil (HU-06): se muestran como texto con un botón "Editar";
 * al editar aparece FormularioPerfil, con "Guardar cambios" y "Cancelar" (CA3 y CA4).
 * Si falta el teléfono, avisa para completarlo.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Divider, Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { DatosEditablesPerfil, Perfil } from '@/types';

import { FormularioPerfil } from './FormularioPerfil';

type Props = {
  perfil: Perfil;
  editando: boolean;
  guardando: boolean;
  mensajeError: string | null;
  onEditar: () => void;
  onCancelar: () => void;
  onGuardar: (datos: DatosEditablesPerfil) => void;
};

export function DatosContacto({
  perfil,
  editando,
  guardando,
  mensajeError,
  onEditar,
  onCancelar,
  onGuardar,
}: Props) {
  const datos = [
    { etiqueta: 'Teléfono celular', valor: perfil.telefono },
    { etiqueta: 'Dirección', valor: perfil.direccion },
  ];

  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        Datos de contacto
      </Text>

      {perfil.telefono ? null : (
        <View style={estilos.faltante}>
          <Icon source="information-outline" size={20} color={colores.primarioOscuro} />
          <Text variant="bodyMedium" style={estilos.textoFaltante}>
            Completa tu teléfono para recibir avisos de tus solicitudes.
          </Text>
        </View>
      )}

      {editando ? (
        <FormularioPerfil
          perfil={perfil}
          guardando={guardando}
          mensajeError={mensajeError}
          onGuardar={onGuardar}
          onCancelar={onCancelar}
        />
      ) : (
        <>
          {datos.map((dato, i) => (
            <View key={dato.etiqueta}>
              {i > 0 ? <Divider /> : null}
              <View style={estilos.fila}>
                <Text variant="labelMedium" style={estilos.etiqueta}>
                  {dato.etiqueta}
                </Text>
                <Text variant="bodyLarge" style={dato.valor ? estilos.valor : estilos.sinValor}>
                  {dato.valor || 'Sin registrar'}
                </Text>
              </View>
            </View>
          ))}
          <Button
            mode="contained-tonal"
            icon="pencil-outline"
            onPress={onEditar}
            style={estilos.editar}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Editar datos de contacto"
          >
            Editar
          </Button>
        </>
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
  faltante: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoFaltante: { flex: 1, color: colores.texto },
  fila: { gap: espacio.xs, paddingVertical: espacio.s },
  etiqueta: { color: colores.textoSecundario },
  valor: { color: colores.texto },
  sinValor: { color: colores.textoSecundario, fontFamily: fuentes.regular },
  editar: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
