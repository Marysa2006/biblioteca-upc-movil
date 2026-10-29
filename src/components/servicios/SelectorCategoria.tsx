/**
 * Lista desplegable de la categoría de un servicio (HU-04): un campo con la categoría elegida
 * que, al tocarlo, abre un menú con las seis. Ocupa una sola fila en el formulario.
 * El ícono acompaña al nombre; el color no va solo.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Icon, Menu, Text, TouchableRipple } from 'react-native-paper';

import { acentoServicio, colores, espacio, fuentes, radio } from '@/theme';
import type { CategoriaServicio } from '@/types';
import { CATEGORIAS_SERVICIO, ORDEN_CATEGORIAS } from '@/utils/servicios';

type Props = {
  valor: CategoriaServicio;
  onCambiar: (categoria: CategoriaServicio) => void;
  deshabilitado?: boolean;
  mensajeError?: string;
};

export function SelectorCategoria({ valor, onCambiar, deshabilitado = false, mensajeError }: Props) {
  const [abierto, setAbierto] = useState(false);
  const info = CATEGORIAS_SERVICIO[valor];

  const elegir = (categoria: CategoriaServicio) => {
    setAbierto(false);
    onCambiar(categoria);
  };

  const campo = (
    <View style={[estilos.campo, mensajeError ? estilos.campoError : null, deshabilitado && estilos.campoDeshabilitado]}>
      <TouchableRipple
        onPress={() => setAbierto(true)}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={`Categoría: ${info.nombre}. Cambiar categoría`}
        accessibilityState={{ disabled: deshabilitado, expanded: abierto }}
      >
        <View style={estilos.contenido}>
          <Icon source={info.icono} size={24} color={acentoServicio[valor]} />
          <Text variant="bodyLarge" style={estilos.nombre}>
            {info.nombre}
          </Text>
          <Icon source={abierto ? 'menu-up' : 'menu-down'} size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );

  return (
    <View style={estilos.grupo}>
      <Text variant="labelLarge" style={estilos.etiqueta}>
        Categoría
      </Text>
      <Menu
        visible={abierto}
        onDismiss={() => setAbierto(false)}
        anchor={campo}
        anchorPosition="bottom"
        contentStyle={estilos.menu}
      >
        {ORDEN_CATEGORIAS.map((categoria) => {
          const elegida = categoria === valor;
          return (
            <Menu.Item
              key={categoria}
              title={CATEGORIAS_SERVICIO[categoria].nombre}
              leadingIcon={CATEGORIAS_SERVICIO[categoria].icono}
              trailingIcon={elegida ? 'check' : undefined}
              onPress={() => elegir(categoria)}
              titleStyle={elegida ? estilos.itemElegido : undefined}
              accessibilityLabel={`${CATEGORIAS_SERVICIO[categoria].nombre}${elegida ? ', elegida' : ''}`}
            />
          );
        })}
      </Menu>
      {mensajeError ? (
        <HelperText type="error" visible>
          {mensajeError}
        </HelperText>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.s },
  etiqueta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  // Mismo borde que los campos de texto; overflow: 'hidden' recorta el ripple.
  campo: {
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  campoError: { borderColor: colores.error },
  campoDeshabilitado: { opacity: 0.6 },
  // minHeight: el campo mide como un TextInput y crece con la letra.
  contenido: {
    minHeight: espacio.xl + espacio.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  nombre: { flex: 1, color: colores.texto },
  menu: { backgroundColor: colores.superficie },
  itemElegido: { color: colores.primario, fontFamily: fuentes.seminegrita },
});
