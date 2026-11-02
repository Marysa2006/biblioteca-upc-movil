/**
 * Mi calendario (HU-30). Pantalla apilada; se abre desde el menú de usuario, junto a
 * Notificaciones.
 * - CA1: las reservas y asesorías aprobadas y los préstamos de tablet, por día, semana o mes,
 *   con hora, lugar y tipo de servicio. Como la agenda del facilitador (HU-15): la vista, el
 *   periodo, la tira de días o el mes con lo que hay cada día, y la lista debajo.
 * - CA4: sin permiso de notificaciones, arriba se explica cómo activarlas (la misma tarjeta de
 *   Notificaciones) y el calendario funciona igual.
 * Los recordatorios (CA2 y CA3) los programa SincronizarRecordatorios en el layout raíz.
 * Sin sesión, invita a iniciarla: los compromisos son de cada persona.
 *
 * Patrón de datos: useMisCompromisos() (src/hooks, HU-30 datos), que une useMisReservas(),
 * useMisCitas() y useMisPrestamos() → src/api → mock o API.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { SelectorVistaAgenda, type VistaAgenda } from '@/components/agenda/SelectorVistaAgenda';
import { ConvencionesCalendario } from '@/components/calendario/ConvencionesCalendario';
import { ListaCompromisos } from '@/components/calendario/ListaCompromisos';
import { MesCalendario } from '@/components/calendario/MesCalendario';
import { TiraDiasCalendario } from '@/components/calendario/TiraDiasCalendario';
import { NavegacionPeriodo } from '@/components/espacios/NavegacionPeriodo';
import { TarjetaRecordatorios } from '@/components/notificaciones/TarjetaRecordatorios';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useMisCompromisos } from '@/hooks/useCompromisos';
import { usePermisoRecordatorios } from '@/hooks/useRecordatorios';
import { useRol } from '@/hooks/useRol';
import { colores, espacio, radio } from '@/theme';
import { diaDeAgenda, moverDiaAgenda, tituloSemanaAgenda } from '@/utils/agenda';
import { fechaCompleta, inicioSemana, rangoMes, rangoSemana, sumarDias, sumarMeses, tituloMes } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { contarPorDia } from '@/utils/miCalendario';

const TITULO = 'Mi calendario';

export default function MiCalendario() {
  const { usuario } = useRol();
  const { data: todos, isPending, isError, isRefetching, refetch } = useMisCompromisos();
  const { estado: permiso } = usePermisoRecordatorios();

  const [hoy] = useState(hoyISO);
  const [vista, setVista] = useState<VistaAgenda>('semana');
  // Día y Semana van de lunes a sábado: un domingo arranca en el lunes siguiente.
  const [dia, setDia] = useState(() => diaDeAgenda(hoy));

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

  let titulo = tituloSemanaAgenda(dia);
  if (vista === 'dia') titulo = fechaCompleta(dia);
  else if (vista === 'mes') titulo = tituloMes(dia);

  let contenido;
  if (!usuario) {
    contenido = (
      <View style={estilos.sinSesion}>
        <Text variant="bodyLarge" style={estilos.texto}>
          Inicia sesión para ver tus reservas, asesorías y préstamos en el calendario.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push({ pathname: '/login', params: { volver: '1' } })}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión para ver tu calendario"
        >
          Iniciar sesión
        </Button>
      </View>
    );
  } else if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando tu calendario…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar tu calendario." onReintentar={refetch} />;
  } else {
    const { desde, hasta } = vista === 'mes' ? rangoMes(dia) : rangoSemana(dia);
    const delPeriodo = todos.filter((compromiso) => compromiso.fecha >= desde && compromiso.fecha <= hasta);
    const conteo = contarPorDia(delPeriodo);

    contenido = (
      <>
        <View style={estilos.panel}>
          <SelectorVistaAgenda valor={vista} onCambiar={cambiarVista} />
          <NavegacionPeriodo
            vista={vista}
            titulo={titulo}
            puedeAnterior
            onAnterior={() => mover(-1)}
            onSiguiente={() => mover(1)}
          />
          {vista === 'mes' ? (
            <MesCalendario mes={dia} hoy={hoy} conteo={conteo} onElegirDia={verDia} />
          ) : (
            <TiraDiasCalendario
              semana={dia}
              elegido={vista === 'dia' ? dia : null}
              hoy={hoy}
              conteo={conteo}
              onElegir={verDia}
            />
          )}
          <ConvencionesCalendario />
        </View>
        {/* En Mes, los compromisos se ven en la cuadrícula; al tocar un día se abre su lista. */}
        {vista === 'mes' ? null : <ListaCompromisos vista={vista} fecha={dia} compromisos={delPeriodo} />}
      </>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Tus reservas, asesorías y préstamos de tablet."
        conEncabezado
        recarga={usuario ? { recargando: isRefetching, onRecargar: refetch } : undefined}
      >
        {/* CA4: sin permiso, explica cómo activar los recordatorios; el calendario sigue igual. */}
        {usuario && (permiso === 'por_activar' || permiso === 'bloqueado') ? <TarjetaRecordatorios /> : null}
        {contenido}
      </Pantalla>
    </>
  );
}

const estilos = StyleSheet.create({
  sinSesion: { alignItems: 'center', gap: espacio.m, paddingVertical: espacio.xl },
  texto: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
  panel: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
});
