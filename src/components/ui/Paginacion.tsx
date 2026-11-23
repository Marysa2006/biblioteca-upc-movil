/**
 * Paginación de las listas largas (#161): «‹  Pág. N de M  ›», en una fila centrada (#307: antes
 * eran dos botones grandes que con poco ancho quedaban uno sobre otro). Los botones son de ícono,
 * de 44 px, y el lector de pantalla dice «Página anterior», «Página N de M» y «Página siguiente».
 * Con una sola página no se muestra. Al cambiar de página, la pantalla sube al inicio y la
 * página nueva se anuncia al lector de pantalla.
 *
 * Para una lista, lo común es ListaPaginada, que guarda la página y muestra los botones:
 *
 *   <ListaPaginada elementos={visibles} reinicio={`${filtro}|${busqueda}`}>
 *     {(reserva) => <TarjetaSolicitud key={reserva.id} … />}
 *   </ListaPaginada>
 */
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

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
      <IconButton
        icon="chevron-left"
        mode="outlined"
        size={24}
        onPress={() => ir(pagina - 1)}
        disabled={pagina <= 1}
        iconColor={colores.primario}
        style={estilos.boton}
        accessibilityLabel="Página anterior"
      />
      <Text
        variant="labelLarge"
        style={estilos.texto}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Página ${pagina} de ${paginas}`}
      >
        {`Pág. ${pagina} de ${paginas}`}
      </Text>
      <IconButton
        icon="chevron-right"
        mode="outlined"
        size={24}
        onPress={() => ir(pagina + 1)}
        disabled={pagina >= paginas}
        iconColor={colores.primario}
        style={estilos.boton}
        accessibilityLabel="Página siguiente"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  paginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.m,
    paddingTop: espacio.s,
  },
  // 44 × 44: el área táctil mínima.
  boton: { width: 44, height: 44, margin: 0, borderColor: colores.bordeFuerte },
  texto: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
