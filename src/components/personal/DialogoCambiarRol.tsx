/**
 * Diálogo para asignar o retirar un rol del personal (HU-07).
 * - Rol del personal: facilitador, gestor de espacios o encargado de préstamos (CA1).
 * - Si la persona ya es del personal: "Retirar rol del personal", eligiendo a qué tipo de
 *   usuario vuelve (CA2). PROVISIONAL hasta separar el tipo de usuario del rol (ver TIPOS_USUARIO).
 * Muestra los permisos del rol elegido y el error de la pantalla, incluido el de CA4.
 * No guarda: la pantalla llama a useCambiarRol() con onConfirmar.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Icon, Portal, RadioButton, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Rol, Usuario } from '@/types';
import {
  esPersonal,
  NOMBRE_PERMISO,
  NOMBRE_ROL,
  permisosDe,
  ROLES_ASIGNABLES,
  TIPOS_USUARIO,
} from '@/utils/roles';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  usuario: Usuario | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (rol: Rol) => void;
  onCerrar: () => void;
};

export function DialogoCambiarRol({ usuario, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={usuario != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {usuario ? (
          // key: al abrir el diálogo para otra persona, el rol elegido vuelve a empezar.
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

function Contenido({
  usuario,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { usuario: Usuario }) {
  const [elegido, setElegido] = useState<Rol>(usuario.rol);
  const delPersonal = esPersonal(usuario.rol);
  const retira = delPersonal && !esPersonal(elegido);
  const permisos = permisosDe(elegido);

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Cambiar rol</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${usuario.nombre} · ahora: ${NOMBRE_ROL[usuario.rol]}`}
          </Text>

          <RadioButton.Group onValueChange={(valor) => setElegido(valor as Rol)} value={elegido}>
            <Text variant="labelLarge" style={estilos.seccion} accessibilityRole="header">
              Rol del personal
            </Text>
            {ROLES_ASIGNABLES.map((rol) => (
              <RadioButton.Item
                key={rol}
                value={rol}
                label={NOMBRE_ROL[rol]}
                disabled={guardando}
                style={estilos.opcion}
                labelStyle={estilos.textoOpcion}
              />
            ))}

            {delPersonal ? (
              <>
                <Text variant="labelLarge" style={estilos.seccion} accessibilityRole="header">
                  Retirar rol del personal: vuelve como…
                </Text>
                {TIPOS_USUARIO.map((rol) => (
                  <RadioButton.Item
                    key={rol}
                    value={rol}
                    label={NOMBRE_ROL[rol]}
                    disabled={guardando}
                    style={estilos.opcion}
                    labelStyle={estilos.textoOpcion}
                  />
                ))}
              </>
            ) : null}
          </RadioButton.Group>

          <Text variant="labelMedium" style={estilos.secundario}>
            {retira ? 'Perderá todos los permisos del personal.' : 'Permisos con este rol'}
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

          {mensajeError ? (
            <View style={estilos.aviso} accessibilityLiveRegion="polite">
              <Icon source="alert-circle-outline" size={20} color={coloresEstado.rechazada.texto} />
              <Text variant="bodyMedium" style={estilos.textoAviso}>
                {mensajeError}
              </Text>
            </View>
          ) : null}
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
          onPress={() => onConfirmar(elegido)}
          loading={guardando}
          disabled={guardando || elegido === usuario.rol}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={retira ? 'Confirmar: retirar rol del personal' : 'Confirmar cambio de rol'}
        >
          {retira ? 'Retirar rol' : 'Asignar rol'}
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
  secundario: { color: colores.textoSecundario },
  seccion: { color: colores.texto, fontFamily: fuentes.seminegrita, marginTop: espacio.s },
  opcion: { paddingHorizontal: 0 },
  textoOpcion: { color: colores.texto },
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
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  textoAviso: { flex: 1, color: coloresEstado.rechazada.texto },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
