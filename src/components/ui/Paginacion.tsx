/**
 * Paginación de las listas largas (#161): "Anterior", "Página N de M" y "Siguiente".
 * Con una sola página no se muestra. Al cambiar de página, la pantalla sube al inicio y la
 * página nueva se anuncia al lector de pantalla. Con letra grande, pasa a dos líneas.
 *
 * Para una lista, lo común es ListaPaginada, que guarda la página y muestra los botones:
 *
 *   <ListaPaginada elementos={visibles} reinicio={`${filtro}|${busqueda}`}>
 *     {(reserva) => <TarjetaSolicitud key={reserva.id} … />}
 *   </ListaPaginada>
 */
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';
import { paginar, type Pagina } from '@/utils/paginacion';

import { useSubirAlInicio } from './Pantalla';

type Props = {
  pagina: number;
  paginas: number;
  onCambiar: (pagina: number) => void;
};

/**
 * La página que se ve de una lista. `reinicio` junta lo que, al cambiar, vuelve a la página 1:
 * el filtro, la pestaña o la búsqueda.
 */
export function usePaginacion<T>(lista: T[], reinicio = ''): Pagina<T> & { onCambiar: (pagina: number) => void } {
  const [pagina, setPagina] = useState(1);
  const [reinicioPrevio, setReinicioPrevio] = useState(reinicio);
  // Cualquier cambio de reinicio vuelve a la página 1, también al volver a un filtro que ya
  // estaba (por ejemplo, Todos → Reservas → Todos). Se ajusta durante el render, sin efecto.
  if (reinicioPrevio !== reinicio) {
    setReinicioPrevio(reinicio);
    setPagina(1);
  }
  return {
    ...paginar(lista, reinicioPrevio === reinicio ? pagina : 1),
    onCambiar: setPagina,
  };
}

type PropsLista<T> = {
  elementos: T[];
  /** Lo que, al cambiar, vuelve a la página 1: el filtro, la pestaña o la búsqueda. */
  reinicio?: string;
  /** Cómo se ve cada elemento; debe llevar su key. */
  children: (elemento: T) => ReactNode;
};

/**
 * Muestra 10 elementos por página y, debajo, la paginación. Se puede montar después de los
 * estados de carga y error: guarda la página por dentro.
 */
export function ListaPaginada<T>({ elementos, reinicio = '', children }: PropsLista<T>) {
  const pagina = usePaginacion(elementos, reinicio);
  return (
    <>
      {pagina.elementos.map((elemento) => children(elemento))}
      <Paginacion pagina={pagina.pagina} paginas={pagina.paginas} onCambiar={pagina.onCambiar} />
    </>
  );
}

export function Paginacion({ pagina, paginas, onCambiar }: Props) {
  const subirAlInicio = useSubirAlInicio();

  if (paginas <= 1) return null;

  const ir = (nueva: number) => {
    onCambiar(nueva);
    subirAlInicio();
    // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(`Página ${nueva} de ${paginas}`);
    }
  };

  return (
    <View style={estilos.paginacion}>
      <Button
        mode="outlined"
        icon="chevron-left"
        onPress={() => ir(pagina - 1)}
        disabled={pagina <= 1}
        contentStyle={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
      >
        Anterior
      </Button>
      <Text variant="labelLarge" style={estilos.texto} accessibilityLiveRegion="polite">
        {`Página ${pagina} de ${paginas}`}
      </Text>
      <Button
        mode="outlined"
        icon="chevron-right"
        onPress={() => ir(pagina + 1)}
        disabled={pagina >= paginas}
        contentStyle={[estilos.boton, estilos.iconoDerecha]}
        accessibilityRole="button"
        accessibilityLabel="Página siguiente"
      >
        Siguiente
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Con letra grande, el texto pasa a su propia línea en vez de cortar los botones.
  paginacion: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
    paddingTop: espacio.s,
  },
  boton: { minHeight: 44 },
  iconoDerecha: { flexDirection: 'row-reverse' },
  texto: { flexGrow: 1, textAlign: 'center', color: colores.texto, fontFamily: fuentes.seminegrita },
});
