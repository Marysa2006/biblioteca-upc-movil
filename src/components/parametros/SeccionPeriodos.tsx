/** Periodos académicos (HU-28): nombre, inicio y fin; agregar y quitar. */
import { useFieldArray, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { FormularioParametros } from '@/utils/parametros';

import { CampoParametro } from './CampoParametro';
import { TarjetaSeccion } from './TarjetaSeccion';

export function SeccionPeriodos({ deshabilitado }: { deshabilitado: boolean }) {
  const { control, getValues } = useFormContext<FormularioParametros>();
  const { fields, append, remove } = useFieldArray({ control, name: 'periodos' });

  return (
    <TarjetaSeccion
      titulo="Periodos académicos"
      ayuda="Elige las fechas en el calendario. Los periodos no se pueden cruzar."
    >
      {fields.length === 0 ? (
        <Text variant="bodyMedium" style={estilos.vacio}>
          Todavía no hay periodos.
        </Text>
      ) : null}
      {fields.map((field, i) => {
        const nombre = getValues(`periodos.${i}.nombre`) || `periodo ${i + 1}`;
        return (
          <View key={field.id} style={estilos.elemento}>
            <Text variant="labelLarge" style={estilos.numero}>
              {`Periodo ${i + 1}`}
            </Text>
            <CampoParametro
              nombre={`periodos.${i}.nombre`}
              etiqueta="Nombre"
              placeholder="2026-2"
              deshabilitado={deshabilitado}
            />
            <CampoParametro
              nombre={`periodos.${i}.inicio`}
              etiqueta={`Inicio del periodo ${i + 1}`}
              tipo="fecha"
              deshabilitado={deshabilitado}
            />
            <CampoParametro
              nombre={`periodos.${i}.fin`}
              etiqueta={`Fin del periodo ${i + 1}`}
              tipo="fecha"
              deshabilitado={deshabilitado}
            />
            <Button
              mode="text"
              icon="delete-outline"
              onPress={() => remove(i)}
              disabled={deshabilitado}
              textColor={colores.error}
              contentStyle={estilos.contenidoBoton}
              style={estilos.quitar}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${nombre}`}
            >
              Quitar
            </Button>
          </View>
        );
      })}
      <Button
        mode="contained-tonal"
        icon="plus"
        onPress={() => append({ id: `per-${Date.now()}`, nombre: '', inicio: '', fin: '' })}
        disabled={deshabilitado}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Agregar periodo"
      >
        Agregar periodo
      </Button>
    </TarjetaSeccion>
  );
}

const estilos = StyleSheet.create({
  vacio: { color: colores.textoSecundario },
  elemento: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  numero: { color: colores.texto, fontFamily: fuentes.seminegrita },
  quitar: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
