/** Días festivos (HU-28): fecha y motivo; agregar y quitar. Un festivo no se ofrece (CA3). */
import { useFieldArray, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { FormularioParametros } from '@/utils/parametros';

import { CampoParametro } from './CampoParametro';
import { TarjetaSeccion } from './TarjetaSeccion';

export function SeccionFestivos({ deshabilitado }: { deshabilitado: boolean }) {
  const { control, getValues } = useFormContext<FormularioParametros>();
  const { fields, append, remove } = useFieldArray({ control, name: 'festivos' });

  return (
    <TarjetaSeccion
      titulo="Días festivos"
      ayuda="Estos días no se ofrecen para reservas ni citas."
    >
      {fields.length === 0 ? (
        <Text variant="bodyMedium" style={estilos.vacio}>
          Todavía no hay festivos.
        </Text>
      ) : null}
      {fields.map((field, i) => {
        const fecha = getValues(`festivos.${i}.fecha`) || `festivo ${i + 1}`;
        return (
          <View key={field.id} style={estilos.elemento}>
            <Text variant="labelLarge" style={estilos.numero}>
              {`Festivo ${i + 1}`}
            </Text>
            <CampoParametro
              nombre={`festivos.${i}.fecha`}
              etiqueta="Fecha"
              placeholder="2026-12-08"
              teclado="numbers-and-punctuation"
              largoMaximo={10}
              descripcionAccesible={`Fecha del festivo ${i + 1}, formato año, mes y día`}
              deshabilitado={deshabilitado}
            />
            <CampoParametro
              nombre={`festivos.${i}.motivo`}
              etiqueta="Motivo"
              placeholder="Día festivo nacional"
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
              accessibilityLabel={`Quitar el festivo ${fecha}`}
            >
              Quitar
            </Button>
          </View>
        );
      })}
      <Button
        mode="contained-tonal"
        icon="plus"
        onPress={() => append({ fecha: '', motivo: '' })}
        disabled={deshabilitado}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Agregar festivo"
      >
        Agregar festivo
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
