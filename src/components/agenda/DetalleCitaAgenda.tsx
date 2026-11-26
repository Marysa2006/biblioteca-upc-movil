/**
 * Detalle de una cita para el facilitador (HU-15, CA2): quién la pidió y qué necesita,
 * con su tipo de usuario y su programa o dependencia si se conocen, y los datos de la cita.
 * Si ya se atendió, muestra el resultado o la inasistencia (CA3).
 * Versión 1.1 (#250): todo lo que mandó la persona en la solicitud (nivel, facultad, programa,
 * semestre, asignatura, personas y sus nombres, celular, correo y novedades). Lo que no mandó
 * no se muestra. Si el personal cambió la fecha al aprobar, también la que pidió.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import type { CitaAgenda } from '@/hooks/useAsesorias';
import { colores, espacio, fuentes, radio } from '@/theme';
import { fechaCompleta } from '@/utils/calendario';
import { textoHorario } from '@/utils/fechas';
import { NOMBRE_NIVEL_FORMACION } from '@/utils/constantes';
import { NOMBRE_MODALIDAD } from '@/utils/jornadas';
import { NOMBRE_TIPO } from '@/utils/roles';

export function DetalleCitaAgenda({ cita }: { cita: CitaAgenda }) {
  const modalidad = NOMBRE_MODALIDAD[cita.modalidad];
  // Lo que mandó la persona en la solicitud (1.1); en las citas anteriores, lo del directorio.
  const datos = cita.datosSolicitante;
  const tipo = datos?.tipo ?? cita.solicitanteTipo;
  const programa = datos?.programa ?? cita.solicitantePrograma;
  const participantes = (cita.participantes ?? []).filter((nombre) => nombre.trim() !== '');
  const cambioFecha =
    (cita.fechaSolicitada != null && cita.fechaSolicitada !== cita.fecha) ||
    (cita.horaSolicitada != null && cita.horaSolicitada !== cita.horaInicio);

  return (
    <View style={estilos.bloques}>
      <Bloque titulo="Solicitante">
        <Text variant="titleMedium" style={estilos.nombre}>
          {datos?.nombreCompleto || cita.solicitante}
        </Text>
        {tipo ? <Dato etiqueta="Tipo de usuario" valor={NOMBRE_TIPO[tipo]} /> : null}
        {datos?.nivel ? (
          <Dato etiqueta="Nivel" valor={NOMBRE_NIVEL_FORMACION[datos.nivel]} />
        ) : null}
        {datos?.facultad ? <Dato etiqueta="Facultad" valor={datos.facultad} /> : null}
        {programa ? <Dato etiqueta="Programa o dependencia" valor={programa} /> : null}
        {datos?.semestre ? <Dato etiqueta="Semestre" valor={`${datos.semestre}.º`} /> : null}
        {cita.asignatura ? <Dato etiqueta="Asignatura" valor={cita.asignatura} /> : null}
        <Dato etiqueta="Qué necesita" valor={cita.necesidad} />
        {cita.personas != null ? (
          <Dato
            etiqueta="Personas"
            valor={cita.personas === 1 ? '1 persona' : `${cita.personas} personas`}
          />
        ) : null}
        {participantes.length > 0 ? (
          <Dato etiqueta="Quiénes más asisten" valor={participantes.join(', ')} />
        ) : null}
        {datos?.celular ? <Dato etiqueta="Celular" valor={datos.celular} /> : null}
        {datos?.correo ? <Dato etiqueta="Correo" valor={datos.correo} /> : null}
        {cita.novedades ? <Dato etiqueta="Novedades" valor={cita.novedades} /> : null}
      </Bloque>

      <Bloque titulo="Cita">
        <EtiquetaEstado estado={cita.estado} />
        <Dato etiqueta="Tema" valor={cita.tema} />
        <Dato
          etiqueta="Fecha y hora"
          valor={`${fechaCompleta(cita.fecha)}, ${textoHorario(cita.horaInicio, cita.horaFin)}`}
        />
        {cambioFecha ? (
          <Dato
            etiqueta="Pidió"
            valor={`${fechaCompleta(cita.fechaSolicitada ?? cita.fecha)}, ${cita.horaSolicitada ?? cita.horaInicio}`}
          />
        ) : null}
        <Dato etiqueta="Modalidad" valor={modalidad} />
        {/* La cita nace sin facilitador: se asigna al aprobar (versión 1.1). */}
        <Dato etiqueta="Facilitador" valor={cita.facilitador ?? 'Sin asignar'} />
        {cita.enlaceVirtual ? <Dato etiqueta="Enlace" valor={cita.enlaceVirtual} /> : null}
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
