/**
 * Formulario para registrar o editar una tablet (HU-21): código, serial, modelo, accesorios y
 * estado (CA1). El código o el serial repetidos se marcan bajo su propio campo (CA2).
 * Solo valida y entrega los datos: la pantalla guarda con useCrearTablet() o useEditarTablet().
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { ChipsOpcion } from '@/components/asesorias/ChipsOpcion';
import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { EstadoTablet, Tablet } from '@/types';
import {
  ACCESORIOS_COMUNES,
  crearEsquemaTablet,
  ESTADOS_EDITABLES,
  NOMBRE_ESTADO_TABLET,
} from '@/utils/inventario';

export type DatosTabletGuardar = Omit<Tablet, 'id'>;

type CampoTexto = 'codigo' | 'serial' | 'modelo';

const CAMPOS: { nombre: CampoTexto; etiqueta: string; ayuda: string; mayusculas?: boolean }[] = [
  { nombre: 'codigo', etiqueta: 'Código interno', ayuda: 'Por ejemplo: TAB-007', mayusculas: true },
  { nombre: 'serial', etiqueta: 'Serial del fabricante', ayuda: 'Por ejemplo: SN-SAM-A9-004', mayusculas: true },
  { nombre: 'modelo', etiqueta: 'Modelo', ayuda: 'Por ejemplo: Samsung Galaxy Tab A9' },
];

const AYUDA_ESTADO: Record<EstadoTablet, string> = {
  disponible: 'Se ofrece para préstamo.',
  en_prestamo: 'Está prestada: cambia de estado al recibirla en Préstamos.',
  mantenimiento: 'No se presta mientras se revisa o repara.',
  de_baja: 'Ya no se presta: dañada sin arreglo o retirada.',
};

type Props = {
  tablets: Tablet[];
  /** Sin tablet, el formulario registra una nueva. */
  original?: Tablet;
  guardando: boolean;
  mensajeError: string | null;
  onGuardar: (datos: DatosTabletGuardar) => void;
};

export function FormularioTablet({ tablets, original, guardando, mensajeError, onGuardar }: Props) {
  const [esquema] = useState(() => crearEsquemaTablet(tablets, original?.id));
  const [otroAccesorio, setOtroAccesorio] = useState('');
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitted },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: {
      codigo: original?.codigo ?? '',
      serial: original?.serial ?? '',
      modelo: original?.modelo ?? '',
      accesorios: original?.accesorios ?? ['cargador'],
      estado: original?.estado ?? ('disponible' as EstadoTablet),
    },
  });
  const [accesorios, estado] = useWatch({ control, name: ['accesorios', 'estado'] });
  const prestada = original?.estado === 'en_prestamo';

  const cambiarAccesorios = (lista: string[]) =>
    setValue('accesorios', lista, { shouldDirty: true, shouldValidate: isSubmitted });

  const agregarOtro = () => {
    const nombre = otroAccesorio.trim().toLowerCase();
    if (!nombre) return;
    if (!accesorios.some((a) => a.toLowerCase() === nombre)) cambiarAccesorios([...accesorios, nombre]);
    setOtroAccesorio('');
  };

  // Los accesorios propios de esta tablet también se muestran como chips.
  const opcionesAccesorios = [...new Set([...ACCESORIOS_COMUNES, ...accesorios])].map((nombre) => ({
    valor: nombre,
    etiqueta: nombre,
  }));

  return (
    <View style={estilos.formulario}>
      {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}

      {CAMPOS.map((campo) => (
        <Controller
          key={campo.nombre}
          control={control}
          name={campo.nombre}
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label={campo.etiqueta}
                placeholder={campo.ayuda}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors[campo.nombre] != null}
                disabled={guardando}
                autoCapitalize={campo.mayusculas ? 'characters' : 'sentences'}
                autoCorrect={false}
                maxLength={campo.nombre === 'serial' ? 40 : campo.nombre === 'codigo' ? 20 : 60}
                accessibilityLabel={campo.etiqueta}
              />
              <HelperText type="error" visible={errors[campo.nombre] != null}>
                {errors[campo.nombre]?.message}
              </HelperText>
            </View>
          )}
        />
      ))}

      <ChipsOpcion
        titulo="Accesorios"
        opciones={opcionesAccesorios}
        elegidos={accesorios}
        onCambiar={cambiarAccesorios}
        multiple
        ayuda="Lo que se entrega con la tablet. Se revisa al entregarla y al recibirla."
        mensajeError={errors.accesorios?.message}
        deshabilitado={guardando}
      />
      <View style={estilos.fila}>
        <TextInput
          mode="outlined"
          label="Otro accesorio"
          placeholder="Por ejemplo: teclado"
          value={otroAccesorio}
          onChangeText={setOtroAccesorio}
          onSubmitEditing={agregarOtro}
          disabled={guardando}
          maxLength={30}
          style={estilos.campoOtro}
          accessibilityLabel="Escribir otro accesorio"
        />
        <Button
          mode="outlined"
          icon="plus"
          onPress={agregarOtro}
          disabled={guardando || otroAccesorio.trim() === ''}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Agregar el accesorio escrito"
        >
          Agregar
        </Button>
      </View>

      {prestada ? (
        <View style={estilos.grupo}>
          <Text variant="labelLarge" style={estilos.titulo}>
            Estado
          </Text>
          <Text variant="bodyMedium" style={estilos.ayuda}>
            {`${NOMBRE_ESTADO_TABLET.en_prestamo}. ${AYUDA_ESTADO.en_prestamo}`}
          </Text>
        </View>
      ) : (
        <ChipsOpcion
          titulo="Estado"
          opciones={ESTADOS_EDITABLES.map((valor) => ({ valor, etiqueta: NOMBRE_ESTADO_TABLET[valor] }))}
          elegidos={[estado]}
          onCambiar={([valor]) =>
            valor && setValue('estado', valor, { shouldDirty: true, shouldValidate: isSubmitted })
          }
          ayuda={AYUDA_ESTADO[estado]}
          mensajeError={errors.estado?.message}
          deshabilitado={guardando}
        />
      )}

      <Button
        mode="contained"
        icon="content-save-outline"
        onPress={() => handleSubmit((datos) => onGuardar(datos))()}
        loading={guardando}
        disabled={guardando || (original != null && !isDirty)}
        style={estilos.boton}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={original ? `Guardar cambios de la tablet ${original.codigo}` : 'Registrar tablet'}
      >
        {original ? 'Guardar cambios' : 'Registrar tablet'}
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: espacio.xs },
  grupo: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, marginBottom: espacio.s },
  campoOtro: { flex: 1 },
  boton: { marginTop: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
