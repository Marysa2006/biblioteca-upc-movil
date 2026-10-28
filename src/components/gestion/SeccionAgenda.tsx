/**
 * Sección Agenda de Gestión (permiso `asesorias`): las citas de asesoría por día, semana o mes
 * (HU-15, CA1). El facilitador ve las suyas; la administración, las de todos, con el nombre del
 * facilitador en cada cita. Quién es administración sale de useRol().esAdministrador, no del
 * permiso: el facilitador también tiene `asesorias`.
 *
 * Los controles van en su propio panel, como el bloque semanal de la web, para no confundirlos
 * con el selector de secciones de Gestión: la vista (Día · Semana · Mes), el periodo, la tira de
 * días con cuántas citas tiene cada uno y las convenciones. Las citas van debajo del panel.
 * - Día y Semana piden la semana completa: la vista Día filtra sobre ella, así que cambiar de
 *   día dentro de la semana no vuelve a consultar. En Semana, tocar un día abre su vista Día.
 * - Mes pide el mes completo y muestra la cuadrícula; tocar un día abre su vista Día.
 * Al tocar una cita se abre su detalle (CA2).
 *
 * Patrón de datos: useAgenda() (src/hooks) → src/api/asesorias.ts → mock o API.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { ConvencionesAgenda } from '@/components/agenda/ConvencionesAgenda';
import { ListaAgenda } from '@/components/agenda/ListaAgenda';
import { MesAgenda } from '@/components/agenda/MesAgenda';
import { SelectorVistaAgenda, type VistaAgenda } from '@/components/agenda/SelectorVistaAgenda';
import { TiraDiasAgenda } from '@/components/agenda/TiraDiasAgenda';
import { NavegacionPeriodo } from '@/components/espacios/NavegacionPeriodo';
import { EstadoCarga, EstadoError } from '@/components/ui';
import { useAgenda } from '@/hooks/useAsesorias';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import {
  contarCitasPorDia,
  diaDeAgenda,
  moverDiaAgenda,
  tituloSemanaAgenda,
} from '@/utils/agenda';
import {
  fechaCompleta,
  inicioSemana,
  rangoMes,
  rangoSemana,
  sumarDias,
  sumarMeses,
  tituloMes,
} from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';

export function SeccionAgenda() {
  const { esAdministrador } = useRol();
  const [hoy] = useState(hoyISO);
  const [vista, setVista] = useState<VistaAgenda>('semana');
  // Día y Semana van de lunes a sábado: un domingo arranca en el lunes siguiente.
  const [dia, setDia] = useState(() => diaDeAgenda(hoy));

  const { desde, hasta } = vista === 'mes' ? rangoMes(dia) : rangoSemana(dia);
  const agenda = useAgenda(desde, hasta, esAdministrador ? 'todas' : undefined);
  const conteo = contarCitasPorDia(agenda.data ?? []);

  const mover = (paso: 1 | -1) => {
    if (vista === 'dia') setDia(moverDiaAgenda(dia, paso));
    else if (vista === 'semana') setDia(sumarDias(inicioSemana(dia), paso * 7));
    else setDia(sumarMeses(dia, paso));
  };

  // Desde el mes, un domingo abre el lunes siguiente.
  const verDia = (fecha: string) => {
    setDia(diaDeAgenda(fecha));
    setVista('dia');
  };

  // Al dejar el mes, el 1 puede caer en domingo.
  const cambiarVista = (nueva: VistaAgenda) => {
    if (nueva !== 'mes') setDia(diaDeAgenda(dia));
    setVista(nueva);
  };

  const abrir = (cita: Cita) =>
    router.push({ pathname: '/agenda/[id]', params: { id: cita.id, desde, hasta } });

  let titulo = tituloSemanaAgenda(dia);
  if (vista === 'dia') titulo = fechaCompleta(dia);
  else if (vista === 'mes') titulo = tituloMes(dia);

  let citas;
  if (agenda.isPending) {
    citas = <EstadoCarga mensaje="Cargando la agenda…" />;
  } else if (agenda.isError) {
    citas = <EstadoError mensaje="No pudimos cargar la agenda." onReintentar={() => agenda.refetch()} />;
  } else if (vista !== 'mes') {
    citas = (
      <ListaAgenda
        vista={vista}
        fecha={dia}
        citas={agenda.data}
        mostrarFacilitador={esAdministrador}
        onAbrir={abrir}
      />
    );
  }

  return (
    <View style={estilos.seccion}>
      <View style={estilos.panel}>
        <View style={estilos.encabezado}>
          <Icon source="calendar-month-outline" size={24} color={colores.primario} />
          <View style={estilos.textosEncabezado}>
            <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
              {esAdministrador ? 'Agenda de asesorías' : 'Mi agenda'}
            </Text>
            <Text variant="bodySmall" style={estilos.subtitulo}>
              {esAdministrador
                ? 'Las citas de todos los facilitadores.'
                : 'Tus citas de asesoría. Toca una para ver el detalle.'}
            </Text>
          </View>
        </View>

        <SelectorVistaAgenda valor={vista} onCambiar={cambiarVista} />
        <NavegacionPeriodo
          vista={vista}
          titulo={titulo}
          puedeAnterior
          onAnterior={() => mover(-1)}
          onSiguiente={() => mover(1)}
        />

        {vista === 'mes' ? (
          <MesAgenda mes={dia} hoy={hoy} conteo={conteo} onElegirDia={verDia} />
        ) : (
          <TiraDiasAgenda
            semana={dia}
            elegido={vista === 'dia' ? dia : null}
            hoy={hoy}
            conteo={conteo}
            onElegir={verDia}
          />
        )}

        <ConvencionesAgenda />
      </View>

      {/* En Mes, las citas se ven en la cuadrícula: debajo solo la carga o el error. */}
      {citas}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.m },
  panel: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  textosEncabezado: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  subtitulo: { color: colores.textoSecundario },
});
