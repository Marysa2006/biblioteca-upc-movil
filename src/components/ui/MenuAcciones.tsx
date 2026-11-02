/**
 * Botón de tres puntos de una tarjeta, que despliega sus acciones (Editar, Desactivar…).
 * Así las acciones no se repiten como botones en cada tarjeta. Cada acción lleva texto e ícono.
 * Mientras se guarda un cambio de la tarjeta (`ocupado`), el botón muestra que está cargando
 * y no se abre.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Menu } from 'react-native-paper';

import { colores, espacio } from '@/theme';

export type AccionMenu = {
  titulo: string;
  icono: string;
  onPress: () => void;
  /** Para el lector de pantalla, por ejemplo "Editar Virtualteca"; si no se da, el título. */
  etiqueta?: string;
};

type Props = {
  acciones: AccionMenu[];
  /** Para el lector de pantalla, por ejemplo "Acciones de Virtualteca". */
  descripcion: string;
  ocupado?: boolean;
};

/** Lo que mide el IconButton de Paper con su ícono de 24 px. */
const TAMANO_BOTON = 40;
/** Con esto el área táctil pasa de 44 px. */
const AMPLIAR_TOQUE = espacio.xs;

export function MenuAcciones({ acciones, descripcion, ocupado = false }: Props) {
  const [abierto, setAbierto] = useState(false);

  if (ocupado) {
    return (
      <View style={estilos.cargando}>
        <ActivityIndicator size="small" color={colores.primario} accessibilityLabel="Guardando…" />
      </View>
    );
  }

  return (
    <Menu
      visible={abierto}
      onDismiss={() => setAbierto(false)}
      anchorPosition="bottom"
      contentStyle={estilos.menu}
      anchor={
        <IconButton
          icon="dots-vertical"
          iconColor={colores.textoSecundario}
          onPress={() => setAbierto(true)}
          style={estilos.boton}
          hitSlop={AMPLIAR_TOQUE}
          accessibilityRole="button"
          accessibilityLabel={descripcion}
        />
      }
    >
      {acciones.map((accion) => (
        <Menu.Item
          key={accion.titulo}
          title={accion.titulo}
          leadingIcon={accion.icono}
          onPress={() => {
            setAbierto(false);
            accion.onPress();
          }}
          accessibilityLabel={accion.etiqueta ?? accion.titulo}
        />
      ))}
    </Menu>
  );
}

const estilos = StyleSheet.create({
  boton: { margin: 0 },
  // Mismo tamaño que el botón, para que la tarjeta no salte al guardar.
  cargando: { width: TAMANO_BOTON, height: TAMANO_BOTON, alignItems: 'center', justifyContent: 'center' },
  menu: { backgroundColor: colores.superficie },
});
