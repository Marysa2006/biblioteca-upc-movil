/**
 * Sección Agenda de Gestión (permiso `asesorias`): las citas de asesoría por día y por semana
 * (HU-15, CA1). El facilitador ve las suyas; la administración, las de todos, con el nombre del
 * facilitador en cada cita. Quién es administración sale de useRol().esAdministrador, no del
 * permiso: el facilitador también tiene `asesorias`.
 * Siempre se pide la semana del día que se ve: la vista del día filtra sobre ella, así que
 * cambiar de vista no vuelve a consultar. Al tocar una cita se abre su detalle (CA2).
 *
 * Patrón de datos: useAgenda() (src/hooks) → src/api/asesorias.ts → mock o API.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListaAgenda } from '@/components/agenda/ListaAgenda';
import { NavegacionPeriodo } from '@/components/espacios/NavegacionPeriodo';
import { SelectorVista } from '@/components/espacios/SelectorVista';
import { EstadoCarga, EstadoError } from '@/components/ui';
import { useAgenda } from '@/hooks/useAsesorias';
import { useRol } from '@/hooks/useRol';
import { espacio } from '@/theme';
import type { Cita } from '@/types';
import { fechaCompleta, inicioSemana, rangoSemana, sumarDias, tituloSemana } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';

type VistaAgenda = 'dia' | 'semana';

const OPCIONES: VistaAgenda[] = ['dia', 'semana'];

export function SeccionAgenda() {
  const { esAdministrador } = useRol();
  const [vista, setVista] = useState<VistaAgenda>('semana');
  const [dia, setDia] = useState(hoyISO);

  const { desde, hasta } = rangoSemana(dia);
  const filtro = esAdministrador ? 'todas' : undefined;
  const agenda = useAgenda(desde, hasta, filtro);

  const mover = (paso: 1 | -1) =>
    setDia(vista === 'dia' ? sumarDias(dia, paso) : sumarDias(inicioSemana(dia), paso * 7));

  const abrir = (cita: Cita) =>
    router.push({ pathname: '/agenda/[id]', params: { id: cita.id, desde, hasta } });

  let contenido;
  if (agenda.isPending) {
    contenido = <EstadoCarga mensaje="Cargando la agenda…" />;
  } else if (agenda.isError) {
    contenido = <EstadoError mensaje="No pudimos cargar la agenda." onReintentar={() => agenda.refetch()} />;
  } else {
    contenido = (
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
      <SelectorVista
        valor={vista}
        onCambiar={(valor) => setVista(valor === 'dia' ? 'dia' : 'semana')}
        opciones={OPCIONES}
      />
      <NavegacionPeriodo
        vista={vista}
        titulo={vista === 'dia' ? fechaCompleta(dia) : tituloSemana(dia)}
        puedeAnterior
        onAnterior={() => mover(-1)}
        onSiguiente={() => mover(1)}
      />
      {contenido}
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.m },
});
