/**
 * Lista desplegable para elegir una opción entre nombres largos, como la facultad o el programa
 * (#251). Se ve como un campo con ▾ (el mismo aspecto que SelectorSemestre) y, al tocarlo, abre
 * un menú del mismo ancho que el campo.
 * No usa Menu.Item: corta el título en una línea y mide como máximo 280 px, así que «Licenciatura
 * en Ciencias Naturales y Educación Ambiental» quedaría a medias. Cada opción baja de línea si no
 * cabe, mide al menos 48 px y la elegida lleva ✓. Si el menú no cabe en la pantalla, se desplaza.
 * Con `etiquetaDe`, lo que se ve puede ser distinto del valor: por ejemplo, los filtros de
 * Estadísticas guardan 'espacios' y muestran «Espacios (9)» (#307).
 */
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { HelperText, Icon, Menu, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Props = {
  /** Lo que se ve sobre el campo, por ejemplo "Facultad" o "Facultad (opcional)". */
  etiqueta: string;
  /** Para el lector: "Facultad: Educación". */
  nombre: string;
  opciones: readonly string[];
  /** La opción elegida; '' sin elegir. */
  valor: string;
  onCambiar: (valor: string) => void;
  /** Lo que dice el campo vacío, por ejemplo "Elige tu facultad". */
  textoVacio: string;
  mensajeError?: string;
  deshabilitado?: boolean;
  /** Lo que se ve de cada opción; por defecto, la opción tal cual. */
  etiquetaDe?: (opcion: string) => string;
};

export function CampoDesplegable({
  etiqueta,
  nombre,
  opciones,
  valor,
  onCambiar,
  textoVacio,
  mensajeError,
  deshabilitado = false,
  etiquetaDe = (opcion) => opcion,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [ancho, setAncho] = useState(0);
  const error = mensajeError != null;

  const elegir = (opcion: string) => {
    setAbierto(false);
    onCambiar(opcion);
  };

  const campo = (
    <View
      style={[
        estilos.campo,
        error ? estilos.campoError : null,
        deshabilitado && estilos.campoDeshabilitado,
      ]}
      onLayout={(evento: LayoutChangeEvent) => setAncho(evento.nativeEvent.layout.width)}
    >
      <TouchableRipple
        onPress={() => setAbierto(true)}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={`${nombre}: ${valor ? etiquetaDe(valor) : 'sin elegir'}. Cambiar ${nombre.toLowerCase()}`}
        accessibilityState={{ disabled: deshabilitado, expanded: abierto }}
      >
        <View style={estilos.contenido}>
          <Text variant="bodyLarge" style={valor ? estilos.nombre : estilos.vacio}>
            {valor ? etiquetaDe(valor) : textoVacio}
          </Text>
          <Icon
            source={abierto ? 'menu-up' : 'menu-down'}
            size={24}
            color={colores.textoSecundario}
          />
        </View>
      </TouchableRipple>
    </View>
  );

  return (
    <View style={estilos.grupo}>
      <Text variant="bodyMedium" style={estilos.etiqueta}>
        {etiqueta}
      </Text>
      <Menu
        visible={abierto}
        onDismiss={() => setAbierto(false)}
        anchor={campo}
        anchorPosition="bottom"
        // Del mismo ancho que el campo, para que los nombres largos no se corten.
        contentStyle={[estilos.menu, ancho > 0 ? { width: ancho } : null]}
      >
        {opciones.map((opcion) => {
          const elegida = opcion === valor;
          return (
            <TouchableRipple
              key={opcion}
              onPress={() => elegir(opcion)}
              accessibilityRole="menuitem"
              accessibilityLabel={`${etiquetaDe(opcion)}${elegida ? ', elegida' : ''}`}
              accessibilityState={{ selected: elegida }}
            >
              <View style={estilos.opcion}>
                <Text
                  variant="bodyLarge"
                  style={elegida ? estilos.textoElegida : estilos.textoOpcion}
                >
                  {etiquetaDe(opcion)}
                </Text>
                {elegida ? <Icon source="check" size={20} color={colores.primario} /> : null}
              </View>
            </TouchableRipple>
          );
        })}
      </Menu>
      <View accessibilityLiveRegion="polite">
        <HelperText type="error" visible={error}>
          {mensajeError}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.xs },
  etiqueta: { color: colores.texto },
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
  vacio: { flex: 1, color: colores.textoSecundario },
  menu: { backgroundColor: colores.superficie },
  // Al menos 48 px de alto; con nombres largos o letra grande, crece.
  opcion: {
    minHeight: espacio.xl + espacio.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  textoOpcion: { flex: 1, color: colores.texto },
  textoElegida: { flex: 1, color: colores.primario, fontFamily: fuentes.seminegrita },
});
