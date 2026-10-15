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
      icono="calendar-range"
      titulo="Periodos académicos"
      ayuda="Fechas en formato AAAA-MM-DD. Los periodos no se pueden cruzar."
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
              etiqueta="Inicio"
              placeholder="2026-08-03"
              teclado="numbers-and-punctuation"
              largoMaximo={10}
              descripcionAccesible={`Inicio del periodo ${i + 1}, formato año, mes y día`}
              deshabilitado={deshabilitado}
            />
            <CampoParametro
              nombre={`periodos.${i}.fin`}
              etiqueta="Fin"
              placeholder="2026-11-28"
              teclado="numbers-and-punctuation"
              largoMaximo={10}
              descripcionAccesible={`Fin del periodo ${i + 1}, formato año, mes y día`}
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
