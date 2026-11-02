/**
 * Sección Agenda de Gestión (permiso `asesorias`): las citas de asesoría en tres vistas, cada una
 * con su función (HU-15, CA1). El facilitador ve las suyas; la administración, las de todos, con
 * el nombre del facilitador en cada cita. Quién es administración sale de useRol().esAdministrador,
 * no del permiso: el facilitador también tiene `asesorias`.
 *
 * - Hoy (vista inicial): las tarjetas del día, de la primera a la última. Con ‹ › se pasa a otros
 *   días. Sin citas, el vacío dice por qué si el día no tiene atención (motivoNoDisponible, HU-28).
 * - Semana: la malla horaria (MallaSemana), con las horas de atención de los parámetros. Tocar
 *   un día del encabezado lo abre en Hoy.
 * - Mes: el calendario con las citas de cada día por estado; al tocar un día, sus citas debajo.
 * Las tres usan los mismos datos y el mismo filtro por estado: el embudo de arriba a la derecha,
 * con un chip para quitarlo mientras está activo. Cuando el periodo no es
 * el actual, un botón regresa a hoy, a esta semana o a este mes. Al tocar una cita se abre su
 * detalle (CA2).
 *
 * Patrón de datos: useAgenda() y useParametros() (src/hooks) → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { BotonFiltroAgenda, ChipFiltroAgenda } from '@/components/agenda/FiltroAgenda';
import { ListaAgenda } from '@/components/agenda/ListaAgenda';
import { MallaSemana } from '@/components/agenda/MallaSemana';
import { MesAgenda } from '@/components/agenda/MesAgenda';
import { SelectorVistaAgenda, type VistaAgenda } from '@/components/agenda/SelectorVistaAgenda';
import { NavegacionPeriodo } from '@/components/espacios/NavegacionPeriodo';
import { EstadoCarga, EstadoError } from '@/components/ui';
import { useAgenda } from '@/hooks/useAsesorias';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita, EstadoSolicitud } from '@/types';
import {
  citasAsignadas,
  contarCitasPorDia,
  diaDeAgenda,
  diasAgenda,
  filtrarPorEstado,
  moverDiaAgenda,
  nombreEstadoAgenda,
  rangoHorasMalla,
  tituloSemanaAgenda,
} from '@/utils/agenda';
import {
  fechaCompleta,
  inicioSemana,
  mismoMes,
  rangoMes,
  rangoSemana,
  sumarDias,
  sumarMeses,
  tituloMes,
} from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { motivoNoDisponible } from '@/utils/parametros';

/** La vista del día se llama "Hoy" en la agenda. */
const ETIQUETAS_VISTA = { dia: 'Hoy' };

/** El botón que regresa al periodo actual, según la vista. */
const VOLVER_A: Record<VistaAgenda, string> = {
  dia: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
};

export function SeccionAgenda() {
  const { esAdministrador } = useRol();
  const [hoy] = useState(hoyISO);
  const [vista, setVista] = useState<VistaAgenda>('dia');
  // En Hoy, el día que se ve; en Semana, cualquier día de la semana; en Mes, el día elegido.
  const [dia, setDia] = useState(hoy);

  const { desde, hasta } = vista === 'mes' ? rangoMes(dia) : rangoSemana(dia);
  const agenda = useAgenda(desde, hasta, esAdministrador ? 'todas' : undefined);
  // Los parámetros dan las horas de la malla y por qué un día no tiene atención. Si no cargan,
  // la agenda funciona igual: la malla usa 7:00 a 19:00 y no marca días sin atención.
  const { data: parametros } = useParametros();
  const motivoCerrado = (fecha: string) =>
    parametros ? motivoNoDisponible(fecha, parametros) : null;

  // El filtro por estado se aplica a las tres vistas; no vuelve a consultar.
  const [filtro, setFiltro] = useState<EstadoSolicitud | null>(null);
  const citasVisibles = filtrarPorEstado(citasAsignadas(agenda.data ?? []), filtro);

  // La semana va de lunes a sábado: un domingo muestra la semana siguiente.
  const esActual = {
    dia: dia === hoy,
    semana: inicioSemana(dia) === inicioSemana(diaDeAgenda(hoy)),
    mes: mismoMes(dia, hoy),
  }[vista];

  const mover = (paso: 1 | -1) => {
    if (vista === 'dia') setDia(moverDiaAgenda(dia, paso));
    else if (vista === 'semana') setDia(sumarDias(inicioSemana(dia), paso * 7));
    else {
      // En otro mes queda elegido el día 1; en el mes actual, hoy.
      const otroMes = sumarMeses(dia, paso);
      setDia(mismoMes(otroMes, hoy) ? hoy : otroMes);
    }
  };

  const volverAlActual = () => setDia(vista === 'semana' ? diaDeAgenda(hoy) : hoy);

  const cambiarVista = (nueva: VistaAgenda) => {
    if (nueva === 'semana') setDia(diaDeAgenda(dia));
    setVista(nueva);
  };

  const verDia = (fecha: string) => {
    setDia(fecha);
    setVista('dia');
  };

  const abrir = (cita: Cita) =>
    router.push({ pathname: '/agenda/[id]', params: { id: cita.id, desde, hasta } });

  let titulo = tituloSemanaAgenda(dia);
  if (vista === 'dia')
    titulo = dia === hoy ? `Hoy, ${fechaCompleta(dia).toLowerCase()}` : fechaCompleta(dia);
  else if (vista === 'mes') titulo = tituloMes(dia);

  // El vacío de un día: por qué no tiene atención o, si la tiene, que no hay citas.
  const vacioDelDia = (fecha: string) => {
    const cerrado = motivoCerrado(fecha);
    if (cerrado) return `Este día no hay atención: ${cerrado}.`;
    const quien = esAdministrador ? 'No hay citas' : 'No tienes citas';
    const sinCitas = filtro ? `${quien} ${nombreEstadoAgenda(filtro, 2)}` : quien;
    return `${sinCitas} ${fecha === hoy ? 'hoy' : 'este día'}.`;
  };

  let citas;
  if (agenda.isPending) {
    citas = <EstadoCarga mensaje="Cargando la agenda…" />;
  } else if (agenda.isError) {
    citas = (
      <EstadoError mensaje="No pudimos cargar la agenda." onReintentar={() => agenda.refetch()} />
    );
  } else if (vista === 'dia') {
    citas = (
      <ListaAgenda
        fecha={dia}
        citas={citasVisibles}
        mostrarFacilitador={esAdministrador}
        mensajeVacio={vacioDelDia(dia)}
        onAbrir={abrir}
      />
    );
  } else if (vista === 'semana') {
    const dias = diasAgenda(dia);
    const sinCitas = !citasVisibles.some((cita) => dias.includes(cita.fecha));
    citas = (
      <>
        {sinCitas ? (
          <Text variant="bodyMedium" style={estilos.aviso}>
            {filtro
              ? `No hay citas ${nombreEstadoAgenda(filtro, 2)} esta semana.`
              : 'No hay citas esta semana.'}
          </Text>
        ) : null}
        <MallaSemana
          key={dias[0]}
          dias={dias}
          hoy={hoy}
          citas={citasVisibles}
          rango={rangoHorasMalla(parametros?.horarios, citasVisibles)}
          mostrarFacilitador={esAdministrador}
          motivoCerrado={motivoCerrado}
          onAbrir={abrir}
          onElegirDia={verDia}
        />
      </>
    );
  } else {
    citas = (
      <View style={estilos.delDia}>
        <Text variant="titleSmall" style={estilos.tituloDia} accessibilityRole="header">
          {dia === hoy ? `Hoy, ${fechaCompleta(dia).toLowerCase()}` : fechaCompleta(dia)}
        </Text>
        <ListaAgenda
          fecha={dia}
          citas={citasVisibles}
          mostrarFacilitador={esAdministrador}
          mensajeVacio={vacioDelDia(dia)}
          onAbrir={abrir}
        />
      </View>
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
          <BotonFiltroAgenda filtro={filtro} onCambiar={setFiltro} />
        </View>

        <SelectorVistaAgenda valor={vista} onCambiar={cambiarVista} etiquetas={ETIQUETAS_VISTA} />
        <View>
          <NavegacionPeriodo
            vista={vista}
            titulo={titulo}
            puedeAnterior
            onAnterior={() => mover(-1)}
            onSiguiente={() => mover(1)}
          />
          {esActual ? null : (
            <Button
              mode="text"
              icon="calendar-today"
              compact
              onPress={volverAlActual}
              style={estilos.volver}
              accessibilityRole="button"
              accessibilityLabel={`Volver a ${VOLVER_A[vista].toLowerCase()}`}
            >
              {VOLVER_A[vista]}
            </Button>
          )}
        </View>

        {vista === 'mes' ? (
          <MesAgenda
            mes={dia}
            hoy={hoy}
            elegido={dia}
            conteo={contarCitasPorDia(citasVisibles)}
            onElegirDia={setDia}
          />
        ) : null}

        <ChipFiltroAgenda filtro={filtro} onCambiar={setFiltro} />
      </View>

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
  volver: { alignSelf: 'center' },
  aviso: { color: colores.textoSecundario, textAlign: 'center' },
  delDia: { gap: espacio.s },
  tituloDia: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
