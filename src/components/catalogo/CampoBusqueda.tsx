/**
 * Campo de búsqueda del Catálogo, con el botón Buscar (Koha y repositorio).
 * Guarda lo que se escribe y avisa a la pantalla solo al buscar; la × borra el texto y los
 * resultados. Sin texto, Buscar no se puede presionar y lo explica al lector de pantalla.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

import { espacio } from '@/theme';

type Props = {
  /** Etiqueta del campo, por ejemplo "Buscar en el catálogo". */
  etiqueta: string;
  /** Ejemplo dentro del campo vacío, por ejemplo "Título, autor o tema". */
  ejemplo: string;
  /** Busca el texto; vacío, quita los resultados. */
  onBuscar: (texto: string) => void;
};

export function CampoBusqueda({ etiqueta, ejemplo, onBuscar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const texto = busqueda.trim();

  const buscar = () => {
    if (texto !== '') onBuscar(texto);
  };
  const limpiar = () => {
    setBusqueda('');
    onBuscar('');
  };

  return (
    <View style={estilos.contenedor}>
      <TextInput
        mode="outlined"
        label={etiqueta}
        accessibilityLabel={etiqueta}
        placeholder={ejemplo}
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={buscar}
        returnKeyType="search"
        // Decorativo: sin esto, el lector lo anuncia como un botón sin nombre.
        left={<TextInput.Icon icon="magnify" accessible={false} importantForAccessibility="no" />}
        right={
          busqueda !== '' ? (
            <TextInput.Icon
              icon="close"
              onPress={limpiar}
              accessibilityRole="button"
              accessibilityLabel="Borrar la búsqueda"
            />
          ) : null
        }
      />
      <Button
        mode="contained"
        icon="magnify"
        onPress={buscar}
        disabled={texto === ''}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={texto !== '' ? `Buscar «${texto}»` : 'Buscar. Escribe primero qué buscas'}
      >
        Buscar
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.m },
  contenidoBoton: { paddingVertical: espacio.xs },
});
