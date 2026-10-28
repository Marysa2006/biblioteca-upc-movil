/**
 * Fila de opciones del mismo ancho, de a 3 por fila, con el nombre arriba y la cantidad debajo.
 * Inventario la usa en dos niveles, con estilos distintos para que no se confundan:
 * - 'seccion': el selector principal (Tablets · Préstamos · Vencidos). Lleno y oscuro el elegido;
 *   la cantidad solo aparece si hay algo que contar (los vencidos).
 * - 'filtro': los filtros de una sección. Claro y con borde; siempre dice cuántos hay.
 * Si hay más de 3 opciones, pasan a la fila siguiente. Con letra grande, cada casilla crece
 * hacia abajo en vez de cortarse.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

export type OpcionConteo<T extends string> = {
  valor: T;
  etiqueta: string;
  /** Sin cantidad, la casilla solo dice el nombre. */
  cantidad?: number;
};

type Props<T extends string> = {
  opciones: OpcionConteo<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Para el lector de pantalla, por ejemplo "Secciones de Inventario" o "Filtrar préstamos". */
  descripcion: string;
  variante: 'seccion' | 'filtro';
};

export function SelectorConteo<T extends string>({
  opciones,
  valor,
  onCambiar,
  descripcion,
  variante,
}: Props<T>) {
  const esSeccion = variante === 'seccion';
  return (
    <View
      style={estilos.fila}
      accessibilityRole={esSeccion ? 'tablist' : undefined}
      accessibilityLabel={descripcion}
    >
      {opciones.map((opcion) => {
        const elegida = opcion.valor === valor;
        const conCantidad = opcion.cantidad != null;
        const estiloCasilla = esSeccion
          ? elegida
            ? estilos.seccionElegida
            : estilos.seccion
          : elegida
            ? estilos.filtroElegido
            : estilos.filtro;
        const estiloTexto = esSeccion && elegida ? estilos.textoSobreOscuro : estilos.texto;
        return (
          <View key={opcion.valor} style={[estilos.casilla, estiloCasilla]}>
            <TouchableRipple
              onPress={() => onCambiar(opcion.valor)}
              style={estilos.contenido}
              accessibilityRole={esSeccion ? 'tab' : 'button'}
              accessibilityState={{ selected: elegida }}
              accessibilityLabel={conCantidad ? `${opcion.etiqueta}, ${opcion.cantidad}` : opcion.etiqueta}
            >
              <View style={estilos.textos}>
                <Text
                  variant="labelLarge"
                  style={[estiloTexto, elegida ? estilos.negrita : estilos.seminegrita]}
                >
                  {opcion.etiqueta}
                </Text>
                {conCantidad ? (
                  <Text variant="labelMedium" style={[estiloTexto, estilos.seminegrita]}>
                    {`(${opcion.cantidad})`}
                  </Text>
                ) : null}
              </View>
            </TouchableRipple>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  // flexBasis 30 % deja 3 por fila con el espacio entre ellas; flexGrow reparte el resto.
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  casilla: {
    flexGrow: 1,
    flexBasis: '30%',
    borderRadius: radio.boton,
    borderWidth: 1,
    overflow: 'hidden',
  },
  seccion: { backgroundColor: colores.primarioSuave, borderColor: colores.primarioSuave },
  seccionElegida: { backgroundColor: colores.primarioOscuro, borderColor: colores.primarioOscuro },
  filtro: { backgroundColor: colores.superficie, borderColor: colores.borde },
  filtroElegido: { backgroundColor: colores.primarioSuave, borderColor: colores.primario },
  // minHeight: 44 px de área táctil; crece con la letra.
  contenido: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
  },
  textos: { alignItems: 'center' },
  texto: { color: colores.primarioOscuro, textAlign: 'center' },
  // Sobre el bloque oscuro, texto blanco (identidad visual).
  textoSobreOscuro: { color: colores.superficie, textAlign: 'center' },
  seminegrita: { fontFamily: fuentes.seminegrita },
  negrita: { fontFamily: fuentes.negrita },
});
