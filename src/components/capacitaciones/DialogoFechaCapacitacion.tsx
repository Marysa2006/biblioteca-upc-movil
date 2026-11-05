/**
 * Diálogo para proponer otra fecha y hora a una solicitud de capacitación (HU-12, CA1).
 * La fecha se elige en el calendario, sin días pasados ni sin atención (HU-28, con
 * motivoDiaCapacitacion), y la hora en el reloj. Empieza vacío y no acepta la fecha y hora que
 * ya tiene la solicitud (fechasYaUsadas). La anticipación mínima la revisa la API y su error
 * sale en el aviso. El usuario debe aceptar la fecha propuesta (CA4).
 * No guarda: el detalle llama a useProponerFechaCapacitacion() con onConfirmar. Va en un
 * Portal, fuera del QueryClientProvider: los parámetros le llegan por props.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { CampoFormulario } from '@/components/reservas/CampoFormulario';
import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { Parametros, SolicitudCapacitacion } from '@/types';
import { sumarMeses } from '@/utils/calendario';
import {
  esquemaFechaCapacitacion,
  fechasYaUsadas,
  MESES_CAPACITACION,
  motivoDiaCapacitacion,
  type ValoresFechaCapacitacion,
} from '@/utils/capacitaciones';
import { fechaLegible, hoyISO } from '@/utils/fechas';

type Props = {
  visible: boolean;
  solicitud: SolicitudCapacitacion;
  parametros: Parametros;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (datos: { fecha: string; hora: string }) => void;
  onCerrar: () => void;
};

export function DialogoFechaCapacitacion({ visible, ...props }: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={props.onCerrar} style={estilos.dialogo}>
        {/* Se monta al abrirlo: los campos vuelven a empezar cada vez. */}
        {visible ? <Contenido {...props} /> : null}
      </Dialog>
    </Portal>
  );
}

function Contenido({
  solicitud,
  parametros,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Omit<Props, 'visible'>) {
  const [hoy] = useState(hoyISO);
  const { control, handleSubmit } = useForm<ValoresFechaCapacitacion>({
    // No se puede proponer la fecha y hora que ya tiene la solicitud (pedida o propuesta).
    resolver: zodResolver(esquemaFechaCapacitacion(parametros, fechasYaUsadas(solicitud))),
    // Empieza vacío: arriba se lee lo que pidió el usuario y la última propuesta.
    defaultValues: { fecha: '', hora: '' },
  });

  const ultimaPropuesta = solicitud.fechaPropuesta
    ? ` La última propuesta fue el ${fechaLegible(solicitud.fechaPropuesta)}${
        solicitud.horaPropuesta ? ` a las ${solicitud.horaPropuesta}` : ''
      }.`
    : '';

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Proponer otra fecha</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${solicitud.solicitante.nombre} pidió el ${fechaLegible(solicitud.fecha)} a las ${solicitud.hora}.${ultimaPropuesta} Debe aceptar la nueva fecha para confirmarla.`}
          </Text>
          <CampoFormulario
            control={control}
            nombre="fecha"
            etiqueta="Nueva fecha"
            tipo="fecha"
            motivoNoElegible={(dia) => motivoDiaCapacitacion(dia, parametros, hoy)}
            mesMinimo={hoy}
            mesMaximo={sumarMeses(hoy, MESES_CAPACITACION)}
            deshabilitado={guardando}
          />
          <CampoFormulario
            control={control}
            nombre="hora"
            etiqueta="Hora"
            tipo="hora"
            deshabilitado={guardando}
          />
          {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
        </ScrollView>
      </Dialog.ScrollArea>

      <Dialog.Actions style={estilos.acciones}>
        <Button
          mode="text"
          onPress={onCerrar}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Volver sin guardar"
        >
          Volver
        </Button>
        <Button
          mode="contained"
          onPress={() =>
            handleSubmit(({ fecha, hora }) =>
              onConfirmar({ fecha: fecha.trim(), hora: hora.trim() }),
            )()
          }
          loading={guardando}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Proponer la nueva fecha a ${solicitud.solicitante.nombre}`}
        >
          Proponer
        </Button>
      </Dialog.Actions>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie, maxHeight: '90%' },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0 },
  contenido: { gap: espacio.xs, paddingHorizontal: espacio.l, paddingVertical: espacio.s },
  texto: { color: colores.texto, marginBottom: espacio.s },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
