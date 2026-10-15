/**
 * Horarios de atención (HU-28): los 7 días, de lunes a domingo. Cada día se abre o se cierra
 * con un interruptor; si está abierto, lleva la hora de apertura y de cierre (HH:MM).
 * Un día cerrado no se ofrece para reservas ni citas (esDiaHabil).
 */
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { FilaInterruptor } from '@/components/ui';
import { colores, espacio, radio } from '@/theme';
import { NOMBRE_DIA, type FormularioParametros } from '@/utils/parametros';

import { CampoParametro } from './CampoParametro';
import { TarjetaSeccion } from './TarjetaSeccion';

export function SeccionHorarios({ deshabilitado }: { deshabilitado: boolean }) {
  const { control } = useFormContext<FormularioParametros>();
  const { fields } = useFieldArray({ control, name: 'dias' });

  return (
    <TarjetaSeccion
      icono="clock-outline"
      titulo="Horarios de atención"
      ayuda="Horas en formato HH:MM de 24 horas. Un día cerrado no se ofrece para reservas ni citas."
    >
      {fields.map((field, i) => (
        <FilaDia key={field.id} indice={i} dia={field.dia} deshabilitado={deshabilitado} />
      ))}
    </TarjetaSeccion>
  );
}

function FilaDia({ indice, dia, deshabilitado }: { indice: number; dia: number; deshabilitado: boolean }) {
  const { control } = useFormContext<FormularioParametros>();
  const abierto = useWatch({ control, name: `dias.${indice}.abierto` });
  const nombreDia = NOMBRE_DIA[dia];

  return (
    <View style={estilos.dia}>
      <Controller
        control={control}
        name={`dias.${indice}.abierto`}
        render={({ field: { value, onChange } }) => (
          <FilaInterruptor
            etiqueta={nombreDia}
            ayuda={value ? 'Abierto' : 'Cerrado'}
            valor={value}
            onCambiar={onChange}
            deshabilitado={deshabilitado}
          />
        )}
      />
      {abierto ? (
        <View style={estilos.horas}>
          <View style={estilos.hora}>
            <CampoParametro
              nombre={`dias.${indice}.abre`}
              etiqueta="Abre"
              placeholder="07:00"
              teclado="numbers-and-punctuation"
              largoMaximo={5}
              descripcionAccesible={`${nombreDia}, hora de apertura`}
              deshabilitado={deshabilitado}
            />
          </View>
          <View style={estilos.hora}>
            <CampoParametro
              nombre={`dias.${indice}.cierra`}
              etiqueta="Cierra"
              placeholder="18:00"
              teclado="numbers-and-punctuation"
              largoMaximo={5}
              descripcionAccesible={`${nombreDia}, hora de cierre`}
              deshabilitado={deshabilitado}
            />
          </View>
        </View>
      ) : null}
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
