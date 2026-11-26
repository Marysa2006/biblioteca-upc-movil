import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, TouchableRipple } from 'react-native-paper';

import type { PersonaEncontrada } from '@/api/backend/usuarios';
import { EstadoError } from '@/components/ui';
import type { useBuscarPersonas } from '@/hooks/useBuscarPersonas';
import { colores, espacio, radio } from '@/theme';
import { mensajeErrorGuardar } from '@/utils/errores';

type Props = {
  seleccion: PersonaEncontrada | null;
  consulta: ReturnType<typeof useBuscarPersonas>;
  texto: string;
  onTexto: (texto: string) => void;
  onElegir: (persona: PersonaEncontrada | null) => void;
  deshabilitado?: boolean;
};

export function SelectorPersona({ seleccion, consulta, texto, onTexto, onElegir, deshabilitado }: Props) {
  if (seleccion) {
    return (
      <View style={estilos.persona}>
        <Text variant="titleSmall">{seleccion.nombre}</Text>
        <Text variant="bodySmall">{seleccion.correo}</Text>
        <Button contentStyle={estilos.toque} disabled={deshabilitado} onPress={() => onElegir(null)}>
          Cambiar persona
        </Button>
      </View>
    );
  }

  return (
    <View style={estilos.lista}>
      <TextInput
        label="Buscar por nombre, correo o identificación"
        mode="outlined"
        value={texto}
        onChangeText={onTexto}
        disabled={deshabilitado}
        autoCorrect={false}
      />
      {texto.trim().length < 3 ? (
        <Text variant="bodySmall">Escribe al menos 3 caracteres.</Text>
      ) : consulta.buscando ? (
        <Text accessibilityLiveRegion="polite">Buscando personas…</Text>
      ) : (
        <>
          {consulta.personas.map((persona) => (
            <TouchableRipple
              key={persona.id}
              accessibilityRole="button"
              accessibilityLabel={persona.nombre + ', ' + persona.correo}
              disabled={deshabilitado}
              onPress={() => onElegir(persona)}
            >
              <View style={estilos.persona}>
                <Text variant="titleSmall">{persona.nombre}</Text>
                <Text variant="bodySmall">{persona.correo}</Text>
              </View>
            </TouchableRipple>
          ))}
          {consulta.error ? (
            <EstadoError
              mensaje={mensajeErrorGuardar(consulta.error)}
              onReintentar={() => consulta.isFetchNextPageError ? consulta.fetchNextPage() : consulta.refetch()}
            />
          ) : consulta.personas.length === 0 ? (
            <Text accessibilityLiveRegion="polite">No encontramos personas.</Text>
          ) : consulta.hasNextPage ? (
            <Button
              contentStyle={estilos.toque}
              loading={consulta.isFetchingNextPage}
              disabled={deshabilitado || consulta.isFetchingNextPage}
              onPress={() => consulta.fetchNextPage()}
            >
              Ver más personas
            </Button>
          ) : null}
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.xs },
  persona: {
    minHeight: 44,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
  },
  toque: { minHeight: 44 },
});
