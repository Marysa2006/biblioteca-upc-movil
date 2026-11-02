/**
 * Calendario de disponibilidad de un espacio (HU-17). Pantalla apilada que no pide cuenta.
 * - CA1: se alterna entre la vista semanal y la mensual.
 * - CA2: cada franja dice si está disponible, reservada, bloqueada o no disponible, con texto.
 * - CA3: solo se muestran el estado y el motivo; nunca quién reservó.
 * Una franja disponible lleva al formulario de reserva (HU-18) con la fecha y la hora puestas.
 * Deslizar hacia abajo recarga el espacio y la disponibilidad.
 *
 * Patrón de datos: useEspacios() / useDisponibilidad() (src/hooks) → src/api/espacios.ts → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { LeyendaDisponibilidad } from '@/components/espacios/LeyendaDisponibilidad';
import { NavegacionPeriodo } from '@/components/espacios/NavegacionPeriodo';
import { SelectorVista, type VistaCalendario } from '@/components/espacios/SelectorVista';
import { VistaMes } from '@/components/espacios/VistaMes';
import { VistaSemana } from '@/components/espacios/VistaSemana';
import { AvisoError, EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useDisponibilidad, useEspacios } from '@/hooks/useEspacios';
import { colores, espacio } from '@/theme';
import type { FranjaDisponibilidad } from '@/types';
import { diaDeAgenda, diasAgenda, tituloSemanaAgenda } from '@/utils/agenda';
import {
  inicioMes,
  inicioSemana,
  rangoMes,
  rangoSemana,
  sumarDias,
  sumarMeses,
  tituloMes,
} from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';

export default function CalendarioEspacio() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();

  // Hoy se fija al abrir la pantalla: es el límite de "anterior" y lo que se marca en el mes.
  const [hoy] = useState(hoyISO);
  const [vista, setVista] = useState<VistaCalendario>('semana');
  // La semana va de lunes a sábado, como la agenda: un domingo abre en el lunes siguiente.
  const [diaElegido, setDiaElegido] = useState(() => diaDeAgenda(hoy));
  const [mes, setMes] = useState(() => inicioMes(hoy));

  const enSemana = vista === 'semana';
  const { desde, hasta } = enSemana ? rangoSemana(diaElegido) : rangoMes(mes);

  const espacios = useEspacios();
  const lugar = espacios.data?.find((e) => e.id === id);
  // Sin espacio válido, la disponibilidad no se pide (el hook se desactiva con el id vacío).
  const disponibilidad = useDisponibilidad(lugar ? id : '', desde, hasta);

  const recargar = () => {
    espacios.refetch();
    if (lugar) disponibilidad.refetch();
  };

  const puedeAnterior = enSemana ? inicioSemana(diaElegido) > inicioSemana(hoy) : mes > inicioMes(hoy);
  const mover = (paso: 1 | -1) =>
    enSemana ? setDiaElegido(sumarDias(diaElegido, 7 * paso)) : setMes(sumarMeses(mes, paso));

  const cambiarVista = (nueva: VistaCalendario) => {
    // El mes abre en el del día elegido, para no perder dónde iba la persona.
    if (nueva === 'mes') setMes(inicioMes(diaElegido));
    setVista(nueva);
  };

  const abrirSemana = (fecha: string) => {
    setDiaElegido(diaDeAgenda(fecha));
    setVista('semana');
  };

  const reservar = (fecha: string, franja: FranjaDisponibilidad) =>
    router.push({
      pathname: '/espacios/[id]/reservar',
      params: { id, fecha, hora: franja.horaInicio },
    });

  let contenido;
  if (espacios.isPending) {
    contenido = <EstadoCarga mensaje="Cargando el espacio…" />;
  } else if (espacios.isError) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar el espacio." onReintentar={() => espacios.refetch()} />
    );
  } else if (!lugar) {
    contenido = <NoDisponible />;
  } else {
    let calendario;
    if (disponibilidad.isPending) {
      calendario = <EstadoCarga mensaje="Cargando la disponibilidad…" />;
    } else if (disponibilidad.isError) {
      calendario = (
        <AvisoError mensaje={`No pudimos cargar la disponibilidad de ${lugar.nombre}.`}>
          <Button
            mode="outlined"
            onPress={() => disponibilidad.refetch()}
            style={estilos.reintentar}
            accessibilityRole="button"
            accessibilityLabel="Reintentar la carga de la disponibilidad"
          >
            Reintentar
          </Button>
        </AvisoError>
      );
    } else if (enSemana) {
      calendario = (
        <VistaSemana
          semana={diasAgenda(diaElegido)}
          dias={disponibilidad.data}
          diaElegido={diaElegido}
          onElegirDia={setDiaElegido}
          onElegirFranja={reservar}
        />
      );
    } else {
      calendario = (
        <VistaMes mes={mes} dias={disponibilidad.data} hoy={hoy} onElegirDia={abrirSemana} />
      );
    }

    contenido = (
      <View style={estilos.calendario}>
        <SelectorVista valor={vista} onCambiar={cambiarVista} />
        <LeyendaDisponibilidad />
        <NavegacionPeriodo
          vista={vista}
          titulo={enSemana ? tituloSemanaAgenda(diaElegido) : tituloMes(mes)}
          puedeAnterior={puedeAnterior}
          onAnterior={() => mover(-1)}
          onSiguiente={() => mover(1)}
        />
        {calendario}
      </View>
    );
  }

  const capacidad = lugar ? `Hasta ${lugar.capacidad} personas · ${lugar.horario}` : undefined;

  return (
    <>
      <EncabezadoApilado titulo="Disponibilidad" />
      <Pantalla
        titulo={lugar?.nombre ?? 'Espacio'}
        subtitulo={capacidad}
        conEncabezado
        recarga={{
          recargando: espacios.isRefetching || disponibilidad.isRefetching,
          onRecargar: recargar,
        }}
      >
        {contenido}
      </Pantalla>
    </>
  );
}

function NoDisponible() {
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/espacios'));

  return (
    <View style={estilos.noDisponible} accessibilityLiveRegion="polite">
      <Icon source="eye-off-outline" size={40} color={colores.textoSecundario} />
      <Text variant="bodyMedium" style={estilos.textoNoDisponible}>
        Este espacio no está disponible o no existe.
      </Text>
      <Button
        mode="outlined"
        onPress={volver}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Volver a los espacios"
      >
        Volver a los espacios
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  calendario: { gap: espacio.m },
  reintentar: { alignSelf: 'flex-start' },
  noDisponible: { alignItems: 'center', gap: espacio.s, paddingVertical: espacio.xl },
  textoNoDisponible: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
