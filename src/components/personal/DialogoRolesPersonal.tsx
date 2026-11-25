/**
 * Diálogo para asignar o retirar los roles del personal de un usuario (HU-07).
 * Un interruptor por rol: una persona puede tener varios, y sus permisos son la suma (CA1, CA2).
 * Apagarlos todos le retira los roles: sigue siendo de la comunidad con su tipo de usuario.
 *
 * "Administración de la biblioteca" no se asigna desde la app: solo aparece si la persona
 * ya lo tiene. La pantalla no abre el diálogo para quien tiene la sesión (CA4); además,
 * useActualizarRolesPersonal() rechaza que la administración se quite su propio rol.
 * No guarda: la pantalla llama a useActualizarRolesPersonal() con onConfirmar.
 *
 * Versión 1.1 (#257 y #296): debajo de los roles, "Permisos adicionales" con tres interruptores
 * (PERMISOS_ASIGNABLES): publicar novedades y avisos, administrar las fotos de Inicio y editar los
 * parámetros generales. No son roles: se suman a los de los roles, y la pantalla los guarda con
 * useActualizarPermisosExtra(). Sin ningún rol marcado se deshabilitan y, al guardar, se quitan.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError, FilaInterruptor } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Permiso, RolPersonal, Usuario } from '@/types';
import {
  NOMBRE_PERMISO,
  NOMBRE_ROL_PERSONAL,
  NOMBRE_TIPO,
  PERMISOS_ASIGNABLES,
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
  onConfirmar: (cambios: CambiosPersonal) => void;
  onCerrar: () => void;
};

/** Lo que se guarda al confirmar: los roles y los permisos adicionales (#257). */
export type CambiosPersonal = { rolesPersonal: RolPersonal[]; permisosExtra: Permiso[]; activo?: boolean };

/** Cómo se llama cada permiso adicional en la ficha y qué permite. */
const PERMISO_ADICIONAL: Partial<Record<Permiso, { etiqueta: string; ayuda: string }>> = {
  novedades: {
    etiqueta: 'Publicar novedades y avisos',
    ayuda: 'Publica avisos e informativos en Inicio, sin tocar los servicios.',
  },
  fotos: {
    etiqueta: 'Administrar las fotos de Inicio',
    ayuda: 'Agrega, ordena, publica y oculta las fotos del carrusel de Inicio.',
  },
  parametros: {
    etiqueta: 'Editar los parámetros generales',
    ayuda: 'Periodos, festivos, horarios de atención, tiempos mínimos y textos automáticos.',
  },
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

/** En el orden de PERMISOS_ASIGNABLES, por la misma razón. */
const ordenarPermisos = (permisos: Permiso[]) =>
  PERMISOS_ASIGNABLES.filter((permiso) => permisos.includes(permiso));

function Contenido({
  usuario,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { usuario: Usuario }) {
  const [roles, setRoles] = useState<RolPersonal[]>(usuario.rolesPersonal);
  const [extra, setExtra] = useState<Permiso[]>(ordenarPermisos(usuario.permisosExtra ?? []));
  const [activo, setActivo] = useState(usuario.activo ?? true);
  const opciones: RolPersonal[] = usuario.rolesPersonal.includes('administrador')
    ? ['administrador', ...ROLES_ASIGNABLES]
    : [...ROLES_ASIGNABLES];
  // Sin ningún rol del personal, los permisos adicionales no sirven (no entra a esa vista): se
  // deshabilitan y, al guardar, se quitan (#296).
  const sinRoles = roles.length === 0;
  const extraVigente = sinRoles ? [] : extra;
  const sinCambios =
    ordenar(roles).join() === ordenar(usuario.rolesPersonal).join() &&
    extraVigente.join() === ordenarPermisos(usuario.permisosExtra ?? []).join() &&
    activo === (usuario.activo ?? true);
  // Los permisos vigentes: los de los roles más los adicionales.
  const permisos = [...new Set([...permisosDeRoles(roles), ...extraVigente])];

  const alternar = (rol: RolPersonal, activo: boolean) =>
    setRoles((actuales) => (activo ? [...actuales, rol] : actuales.filter((r) => r !== rol)));

  const alternarPermiso = (permiso: Permiso, activo: boolean) =>
    setExtra((actuales) =>
      ordenarPermisos(activo ? [...actuales, permiso] : actuales.filter((p) => p !== permiso)),
    );

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Roles y permisos</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${usuario.nombre} · ${NOMBRE_TIPO[usuario.tipo]}`}
          </Text>
          {usuario.activo !== undefined && !usuario.rolesPersonal.includes('administrador') ? (
            <FilaInterruptor
              etiqueta="Cuenta activa"
              ayuda="Desactivar la cuenta impide que la persona inicie sesión."
              valor={activo}
              onCambiar={setActivo}
              deshabilitado={guardando}
            />
          ) : null}

          {opciones.map((rol) => (
            <FilaInterruptor
              key={rol}
              etiqueta={NOMBRE_ROL_PERSONAL[rol]}
              ayuda={PERMISOS_POR_ROL[rol].map((permiso) => NOMBRE_PERMISO[permiso]).join(', ')}
              valor={roles.includes(rol)}
              onCambiar={(activo) => alternar(rol, activo)}
              deshabilitado={guardando || (rol === 'administrador' && usuario.activo !== undefined)}
            />
          ))}

          <Text variant="titleSmall" style={estilos.seccion} accessibilityRole="header">
            Permisos adicionales
          </Text>
          <Text variant="bodySmall" style={estilos.nota} accessibilityLiveRegion="polite">
            {sinRoles
              ? 'Primero asígnale un rol del personal: sin él, estos permisos no le sirven.'
              : 'Tareas que le encargas aparte de sus roles.'}
          </Text>
          {PERMISOS_ASIGNABLES.map((permiso) => {
            const info = PERMISO_ADICIONAL[permiso] ?? { etiqueta: NOMBRE_PERMISO[permiso], ayuda: '' };
            return (
              <FilaInterruptor
                key={permiso}
                etiqueta={info.etiqueta}
                ayuda={info.ayuda || undefined}
                valor={!sinRoles && extra.includes(permiso)}
                onCambiar={(activo) => alternarPermiso(permiso, activo)}
                deshabilitado={guardando || sinRoles}
              />
            );
          })}

          <Text variant="labelMedium" style={estilos.secundario}>
            {permisos.length > 0
              ? 'Permisos con estos roles y los adicionales'
              : 'Sin roles del personal: no tendrá permisos de administración.'}
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
          onPress={() =>
            onConfirmar({
              rolesPersonal: ordenar(roles),
              permisosExtra: extraVigente,
              activo: usuario.activo === undefined ? undefined : activo,
            })
          }
          loading={guardando}
          disabled={guardando || sinCambios}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Guardar los roles y permisos de ${usuario.nombre}`}
        >
          Guardar
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
  seccion: { color: colores.primario, fontFamily: fuentes.seminegrita, marginTop: espacio.s },
  nota: { color: colores.textoSecundario },
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
