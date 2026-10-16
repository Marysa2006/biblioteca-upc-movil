/**
 * Tarjeta de un usuario con su tipo, sus roles del personal y los permisos vigentes (la suma
 * de los de sus roles), para la pantalla de roles (HU-07).
 * Recibe el usuario por props: no sabe de dónde salen los datos.
 * "Cambiar roles" abre el diálogo en la pantalla. La pantalla no muestra la tarjeta de quien
 * tiene la sesión: así nadie puede quitarse su propio rol (CA4).
 */
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Usuario } from '@/types';
import { describirRoles, esPersonal, NOMBRE_PERMISO, NOMBRE_TIPO, permisosDe } from '@/utils/roles';

type Props = {
  usuario: Usuario;
  onCambiarRol: () => void;
};

/** "Diana Ospina" → "DO". */
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

export function TarjetaUsuario({ usuario, onCambiarRol }: Props) {
  const delPersonal = esPersonal(usuario);
  const permisos = permisosDe(usuario);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View
          style={estilos.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text variant="titleMedium" style={estilos.textoAvatar}>
            {iniciales(usuario.nombre)}
          </Text>
        </View>
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.nombre}>
            {usuario.nombre}
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            {delPersonal ? `${usuario.correo} · ${NOMBRE_TIPO[usuario.tipo]}` : usuario.correo}
          </Text>
          <View style={estilos.filaRol}>
            {delPersonal ? (
              <View style={estilos.etiquetaPersonal}>
                <Text variant="labelSmall" style={estilos.textoEtiqueta}>
                  Personal
                </Text>
              </View>
            ) : null}
            <Text variant="labelLarge" style={delPersonal ? estilos.rolPersonal : estilos.secundario}>
              {describirRoles(usuario)}
            </Text>
          </View>
        </View>
      </View>

      <Text variant="labelMedium" style={estilos.secundario}>
        Permisos vigentes
      </Text>
      {permisos.length > 0 ? (
        <View style={estilos.chips}>
          {permisos.map((permiso) => (
            <View key={permiso} style={estilos.chip}>
              <Text variant="labelMedium" style={estilos.textoChip}>
                {NOMBRE_PERMISO[permiso]}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="bodySmall" style={estilos.secundario}>
          Sin permisos del personal.
        </Text>
      )}

      <Button
        mode="contained-tonal"
        icon="account-switch-outline"
        onPress={onCambiarRol}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={`Cambiar roles de ${usuario.nombre}`}
      >
        Cambiar roles
      </Button>
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
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  // minWidth y no width: con letra grande, las iniciales agrandan el recuadro en vez de cortarse.
  avatar: {
    minWidth: espacio.xl + espacio.s,
    aspectRatio: 1,
    padding: espacio.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoAvatar: { color: colores.primarioOscuro, fontFamily: fuentes.negrita },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  filaRol: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacio.s },
  etiquetaPersonal: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs / 2,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioOscuro,
  },
  textoEtiqueta: { color: colores.superficie },
  rolPersonal: { color: colores.primario },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoChip: { color: colores.primarioOscuro },
  contenidoBoton: { paddingVertical: espacio.xs },
});
