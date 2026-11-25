/**
 * Horarios de atención (HU-28): los 7 días, de lunes a domingo. Cada día se abre o se cierra
 * con un interruptor; si está abierto, lleva la hora de apertura y de cierre, elegidas en el reloj.
 * Un día cerrado no se ofrece para reservas ni citas (esDiaHabil).
 */
import { useFieldArray, useFormContext } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from 'react-native-paper';
import { colores, espacio, radio } from '@/theme';
import { NOMBRE_DIA, type FormularioParametros } from '@/utils/parametros';

import { CampoParametro } from './CampoParametro';
import { TarjetaSeccion } from './TarjetaSeccion';

export function SeccionHorarios({ deshabilitado }: { deshabilitado: boolean }) {
  const { control } = useFormContext<FormularioParametros>();
  const { fields } = useFieldArray({ control, name: 'dias' });

  return (
    <TarjetaSeccion
      titulo="Horarios de atención"
      ayuda="Elige las horas en el reloj, cada 30 minutos. Un día cerrado no se ofrece para reservas ni citas."
    >
      {fields.map((field, i) => (
        <FilaDia key={field.id} indice={i} dia={field.dia} deshabilitado={deshabilitado} />
      ))}
    </TarjetaSeccion>
  );
}

function FilaDia({ indice, dia, deshabilitado }: { indice: number; dia: number; deshabilitado: boolean }) {
  const { control } = useFormContext<FormularioParametros>();
  const { fields, append, remove } = useFieldArray({ control, name: `dias.${indice}.franjas` });
  const nombreDia = NOMBRE_DIA[dia];

  return (
    <View style={estilos.dia}>
      <Text variant="titleSmall">{nombreDia}</Text>
      {fields.length === 0 ? <Text>Cerrado</Text> : null}
      {fields.map((field, i) => (
        <View key={field.id}>
          <View style={estilos.horas}>
            <View style={estilos.hora}>
              <CampoParametro nombre={`dias.${indice}.franjas.${i}.abre`}
                etiqueta={`${nombreDia}, franja ${i + 1}, abre`} tipo="hora" deshabilitado={deshabilitado} />
            </View>
            <View style={estilos.hora}>
              <CampoParametro nombre={`dias.${indice}.franjas.${i}.cierra`}
                etiqueta={`${nombreDia}, franja ${i + 1}, cierra`} tipo="hora" deshabilitado={deshabilitado} />
            </View>
          </View>
          <Button onPress={() => remove(i)} disabled={deshabilitado}
            accessibilityLabel={`Quitar franja ${i + 1} del ${nombreDia}`}>Quitar franja</Button>
        </View>
      ))}
      <Button icon="plus" onPress={() => append({ abre: '', cierra: '' })} disabled={deshabilitado}
        accessibilityLabel={`Agregar franja al ${nombreDia}`}>Agregar franja</Button>
    </View>
  );
}
const estilos = StyleSheet.create({
  dia: {
    paddingHorizontal: espacio.s,
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  // flexWrap: con letra grande, "Cierra" pasa debajo de "Abre" en vez de apretarse.
  horas: { flexDirection: 'row', flexWrap: 'wrap', columnGap: espacio.s },
  hora: { flexGrow: 1, flexBasis: '40%' },
});
