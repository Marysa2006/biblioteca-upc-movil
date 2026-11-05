/**
 * Diálogo para asignar el responsable de una capacitación aprobada (HU-12, CA3, primer paso
 * para cerrarla). Ofrece al personal con el permiso `formacion`, como una lista de opciones.
 * Va en un Portal, fuera del QueryClientProvider: el detalle consulta el personal
 * (useUsuarios) y le pasa las opciones, la carga y el error por props.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, RadioButton, Text } from 'react-native-paper';

import { AvisoError, EstadoCarga, EstadoError, EstadoVacio } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { SolicitudCapacitacion } from '@/types';

export type OpcionResponsable = { id: string; nombre: string; roles: string };

type Props = {
  visible: boolean;
  solicitud: SolicitudCapacitacion;
  /** null mientras carga o si falló. */
  opciones: OpcionResponsable[] | null;
  cargando: boolean;
  errorCarga: boolean;
  onReintentar: () => void;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (persona: OpcionResponsable) => void;
  onCerrar: () => void;
};

export function DialogoResponsable({ visible, ...props }: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={props.onCerrar} style={estilos.dialogo}>
        {/* Se monta al abrirlo: la elección vuelve a la persona asignada. */}
        {visible ? <Contenido {...props} /> : null}
      </Dialog>
    </Portal>
  );
}

function Contenido({
  solicitud,
  opciones,
  cargando,
  errorCarga,
  onReintentar,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Omit<Props, 'visible'>) {
  const [elegido, setElegido] = useState(solicitud.responsableId ?? '');
  const persona = opciones?.find((opcion) => opcion.id === elegido);

  let lista;
  if (cargando) {
    lista = <EstadoCarga mensaje="Cargando el personal…" />;
  } else if (errorCarga || !opciones) {
    lista = <EstadoError mensaje="No pudimos cargar el personal." onReintentar={onReintentar} />;
  } else if (opciones.length === 0) {
    lista = <EstadoVacio mensaje="Nadie del personal tiene el permiso de capacitaciones." />;
  } else {
    lista = (
      <RadioButton.Group onValueChange={setElegido} value={elegido}>
        {opciones.map((opcion) => (
          <RadioButton.Item
            key={opcion.id}
            value={opcion.id}
            label={`${opcion.nombre}\n${opcion.roles}`}
            labelStyle={estilos.opcion}
            disabled={guardando}
            mode="android"
            position="leading"
            accessibilityLabel={`${opcion.nombre}, ${opcion.roles}`}
          />
        ))}
      </RadioButton.Group>
    );
  }

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Asignar responsable</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido}>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`Quién atiende la capacitación de ${solicitud.linea} para ${solicitud.solicitante.nombre}.`}
          </Text>
          {lista}
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
          onPress={() => persona && onConfirmar(persona)}
          loading={guardando}
          // Sin elegir a nadie, o con la misma persona, no hay nada que guardar.
          disabled={guardando || !persona || persona.id === solicitud.responsableId}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={persona ? `Asignar a ${persona.nombre}` : 'Asignar responsable'}
        >
          Asignar
        </Button>
      </Dialog.Actions>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie, maxHeight: '90%' },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0 },
  contenido: { gap: espacio.s, paddingHorizontal: espacio.l, paddingVertical: espacio.s },
  texto: { color: colores.texto },
  opcion: { color: colores.texto },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
