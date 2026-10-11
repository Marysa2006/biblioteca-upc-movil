/**
 * Tarjeta de un usuario con su rol, para la pantalla de asignar roles (HU-07).
 * Recibe el usuario por props: no sabe de dónde salen los datos.
 */
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';
import type { Rol, Usuario } from '@/types';
import { esPersonal, NOMBRE_ROL } from '@/utils/roles';

import { SelectorRol } from './SelectorRol';

type Props = {
  usuario: Usuario;
  onCambiarRol: (rol: Rol) => void;
  /** true mientras se guarda el cambio de rol de este usuario. */
  cambiando?: boolean;
  /** true si es el usuario con la sesión abierta: no puede cambiar su propio rol. */
  esUstedMismo?: boolean;
};

export function TarjetaUsuario({ usuario, onCambiarRol, cambiando = false, esUstedMismo = false }: Props) {
  const delPersonal = esPersonal(usuario.rol);

  return (
    <Card mode="contained" style={estilos.tarjeta}>
      <Card.Content style={estilos.contenido}>
        <Text variant="titleMedium" style={estilos.nombre}>
          {esUstedMismo ? `${usuario.nombre} (tú)` : usuario.nombre}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {usuario.correo}
        </Text>
        {usuario.programa ? (
          <Text variant="bodySmall" style={estilos.secundario}>
            {usuario.programa}
          </Text>
        ) : null}

        <View style={estilos.fila}>
          <View style={[estilos.etiqueta, delPersonal ? estilos.etiquetaPersonal : estilos.etiquetaComunidad]}>
            <Text variant="labelMedium" style={{ color: delPersonal ? colores.primario : colores.textoSecundario }}>
              {NOMBRE_ROL[usuario.rol]}
            </Text>
          </View>
          <SelectorRol
            rolActual={usuario.rol}
            onElegir={onCambiarRol}
            cargando={cambiando}
            deshabilitado={esUstedMismo}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  contenido: { gap: espacio.xs },
  nombre: { color: colores.texto, fontWeight: '700' },
  secundario: { color: colores.textoSecundario },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espacio.s,
    marginTop: espacio.s,
  },
  etiqueta: {
    paddingHorizontal: espacio.s + 2,
    paddingVertical: espacio.xs,
    borderRadius: 999,
  },
  etiquetaPersonal: { backgroundColor: colores.primarioSuave },
  etiquetaComunidad: { backgroundColor: '#ECEDF1' },
});
