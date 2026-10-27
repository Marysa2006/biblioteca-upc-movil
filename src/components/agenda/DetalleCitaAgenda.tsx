/**
 * Detalle de una cita para el facilitador (HU-15, CA2): quién la pidió y qué necesita,
 * y los datos de la cita. Si ya se atendió, muestra el resultado o la inasistencia (CA3).
 * El tipo y el programa del solicitante se suman cuando estén en el contrato de Cita.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import { fechaCompleta } from '@/utils/calendario';
import { NOMBRE_MODALIDAD } from '@/utils/jornadas';

export function DetalleCitaAgenda({ cita }: { cita: Cita }) {
  const modalidad = NOMBRE_MODALIDAD[cita.modalidad];

  return (
    <View style={estilos.bloques}>
      <Bloque titulo="Solicitante">
        <Text variant="titleMedium" style={estilos.nombre}>
          {cita.solicitante}
        </Text>
        <Dato etiqueta="Qué necesita" valor={cita.necesidad} />
      </Bloque>

      <Bloque titulo="Cita">
        <EtiquetaEstado estado={cita.estado} />
        <Dato etiqueta="Tema" valor={cita.tema} />
        <Dato
          etiqueta="Fecha y hora"
          valor={`${fechaCompleta(cita.fecha)}, ${cita.horaInicio} – ${cita.horaFin}`}
        />
        <Dato etiqueta="Modalidad" valor={modalidad} />
        <Dato etiqueta="Facilitador" valor={cita.facilitador} />
        {cita.motivo ? <Dato etiqueta="Motivo" valor={cita.motivo} /> : null}
      </Bloque>

      {cita.resultado != null ? (
        <Bloque titulo="Resultado">
          <Text variant="bodyMedium" style={estilos.texto}>
            {cita.resultado}
          </Text>
        </Bloque>
      ) : null}
      {cita.asistio === false ? (
        <Bloque titulo="Asistencia">
          <Text variant="bodyMedium" style={estilos.texto}>
            La persona no asistió.
          </Text>
        </Bloque>
      ) : null}
    </View>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.bloque}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={estilos.dato}>
      <Text variant="labelMedium" style={estilos.etiqueta}>
        {etiqueta}
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        {valor}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloques: { gap: espacio.m },
  bloque: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  titulo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  dato: { gap: espacio.xs },
  etiqueta: { color: colores.textoSecundario },
  texto: { color: colores.texto },
});
