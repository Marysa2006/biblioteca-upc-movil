/**
 * Diálogo para proponer otra fecha u horario a una reserva (HU-19, CA1 "modificar").
 * La fecha se elige en el calendario (sin días pasados) y las horas en el reloj, en punto.
 * Valida que el fin sea después del inicio; los choques de horario (CA3) y el día no hábil
 * (HU-28) los responde la API y se muestran en el aviso.
 * No guarda: la bandeja llama a useDecidirReserva() con onConfirmar.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { Reserva } from '@/types';
import { sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import {
  esquemaOtraFecha,
  MESES_RESERVA,
  motivoDiaReserva,
  type FormularioOtraFecha,
} from '@/utils/reservas';

import { CampoFormulario } from './CampoFormulario';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  reserva: Reserva | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (datos: FormularioOtraFecha) => void;
  onCerrar: () => void;
};

export function DialogoOtraFecha({ reserva, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={reserva != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {reserva ? (
          // key: al abrir el diálogo para otra reserva, los campos vuelven a sus valores.
          <Contenido
            key={reserva.id}
            reserva={reserva}
            guardando={guardando}
            mensajeError={mensajeError}
            onConfirmar={onConfirmar}
            onCerrar={onCerrar}
          />
        ) : null}
      </Dialog>
    </Portal>
  );
}

function Contenido({
  reserva,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { reserva: Reserva }) {
  const [hoy] = useState(hoyISO);
  const { control, handleSubmit } = useForm<FormularioOtraFecha>({
    resolver: zodResolver(esquemaOtraFecha),
    defaultValues: {
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      motivo: '',
    },
  });

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Proponer otra fecha</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${reserva.solicitante} · ${reserva.proposito}`}
          </Text>
          <CampoFormulario
            control={control}
            nombre="fecha"
            etiqueta="Nueva fecha"
            tipo="fecha"
            motivoNoElegible={(dia) => motivoDiaReserva(dia, undefined, hoy)}
            mesMinimo={hoy}
            mesMaximo={sumarMeses(hoy, MESES_RESERVA)}
            deshabilitado={guardando}
          />
          <CampoFormulario
            control={control}
            nombre="horaInicio"
            etiqueta="Hora de inicio"
            tipo="hora"
            pasoMinutos={60}
            deshabilitado={guardando}
          />
          <CampoFormulario
            control={control}
            nombre="horaFin"
            etiqueta="Hora de fin"
            tipo="hora"
            pasoMinutos={60}
            deshabilitado={guardando}
          />
          <CampoFormulario
            control={control}
            nombre="motivo"
            etiqueta="Motivo (opcional)"
            multilinea
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
          onPress={() => handleSubmit(onConfirmar)()}
          loading={guardando}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Proponer la nueva fecha a ${reserva.solicitante}`}
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
