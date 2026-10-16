/**
 * Diálogo para asignar o retirar los roles del personal de un usuario (HU-07).
 * Un interruptor por rol: una persona puede tener varios, y sus permisos son la suma (CA1, CA2).
 * Apagarlos todos le retira los roles: sigue siendo de la comunidad con su tipo de usuario.
 *
 * "Administración de la biblioteca" no se asigna desde la app: solo aparece en la tarjeta
 * de quien ya lo tiene. Si se lo quita a sí misma, el sistema lo impide al confirmar (CA4).
 * No guarda: la pantalla llama a useActualizarRolesPersonal() con onConfirmar.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Icon, Portal, Text } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { RolPersonal, Usuario } from '@/types';
import {
  NOMBRE_PERMISO,
  NOMBRE_ROL_PERSONAL,
  NOMBRE_TIPO,
  PERMISOS_POR_ROL,
  permisosDeRoles,
  ROLES_ASIGNABLES,
  ROLES_PERSONAL,
} from '@/utils/roles';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  usuario: Usuario | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (rolesPersonal: RolPersonal[]) => void;
  onCerrar: () => void;
};

export function DialogoRolesPersonal({ usuario, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={usuario != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {usuario ? (
          // key: al abrir el diálogo para otra persona, los roles elegidos vuelven a empezar.
          <Contenido
            key={usuario.id}
            usuario={usuario}
            guardando={guardando}
            mensajeError={mensajeError}
            onConfirmar={onConfirmar}
            onCerrar={onCerrar}
          />
        ) : null}
      </Dialog>
    </Portal>
  );
}

/** En el orden de ROLES_PERSONAL, para comparar y guardar siempre igual. */
const ordenar = (roles: RolPersonal[]) => ROLES_PERSONAL.filter((rol) => roles.includes(rol));

function Contenido({
  usuario,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { usuario: Usuario }) {
  const [roles, setRoles] = useState<RolPersonal[]>(usuario.rolesPersonal);
  const opciones: RolPersonal[] = usuario.rolesPersonal.includes('administrador')
    ? ['administrador', ...ROLES_ASIGNABLES]
    : [...ROLES_ASIGNABLES];
  const sinCambios = ordenar(roles).join() === ordenar(usuario.rolesPersonal).join();
  const permisos = permisosDeRoles(roles);

  const alternar = (rol: RolPersonal, activo: boolean) =>
    setRoles((actuales) => (activo ? [...actuales, rol] : actuales.filter((r) => r !== rol)));

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Roles del personal</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${usuario.nombre} · ${NOMBRE_TIPO[usuario.tipo]}`}
          </Text>

          {opciones.map((rol) => (
            <FilaInterruptor
              key={rol}
              etiqueta={NOMBRE_ROL_PERSONAL[rol]}
              ayuda={PERMISOS_POR_ROL[rol].map((permiso) => NOMBRE_PERMISO[permiso]).join(', ')}
              valor={roles.includes(rol)}
              onCambiar={(activo) => alternar(rol, activo)}
              deshabilitado={guardando}
            />
          ))}

          <Text variant="labelMedium" style={estilos.secundario}>
            {permisos.length > 0
              ? 'Permisos con estos roles'
              : 'Sin roles del personal: no tendrá permisos de administración.'}
          </Text>
          {permisos.length > 0 ? (
            <View style={estilos.chips}>
              {permisos.map((permiso) => (
                <View key={permiso} style={estilos.chip}>
                  <Icon source="check" size={16} color={colores.primarioOscuro} />
                  <Text variant="labelMedium" style={estilos.textoChip}>
                    {NOMBRE_PERMISO[permiso]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
        </ScrollView>
      </Dialog.ScrollArea>

      <Dialog.Actions style={estilos.acciones}>
        <Button
          mode="text"
          onPress={onCerrar}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={() => onConfirmar(ordenar(roles))}
          loading={guardando}
          disabled={guardando || sinCambios}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Guardar los roles de ${usuario.nombre}`}
        >
          Guardar roles
        </Button>
      </Dialog.Actions>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie, maxHeight: '90%' },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0 },
  contenido: { gap: espacio.s, paddingHorizontal: espacio.l, paddingVertical: espacio.s },
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario, marginTop: espacio.s },
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
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
