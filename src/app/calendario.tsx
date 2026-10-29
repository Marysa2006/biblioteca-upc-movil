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
 * Patrón de datos: useMisReservas() / useMisCitas() / useMisPrestamos() / useEspacios()
 * (src/hooks) → src/api → mock o API.
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
import { useMisCitas } from '@/hooks/useAsesorias';
import { useEspacios } from '@/hooks/useEspacios';
import { usePermisoRecordatorios } from '@/hooks/useRecordatorios';
import { useMisReservas } from '@/hooks/useReservas';
import { useRol } from '@/hooks/useRol';
import { useMisPrestamos } from '@/hooks/useTablets';
import { colores, espacio, radio } from '@/theme';
import { diaDeAgenda, moverDiaAgenda, tituloSemanaAgenda } from '@/utils/agenda';
import { fechaCompleta, inicioSemana, rangoMes, rangoSemana, sumarDias, sumarMeses, tituloMes } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { compromisos as armarCompromisos, contarPorDia } from '@/utils/miCalendario';

const TITULO = 'Mi calendario';

export default function MiCalendario() {
  const { usuario } = useRol();
  const reservas = useMisReservas();
  const citas = useMisCitas();
  const prestamos = useMisPrestamos();
  const { data: espacios } = useEspacios();
  const { estado: permiso } = usePermisoRecordatorios();

  const [hoy] = useState(hoyISO);
  const [vista, setVista] = useState<VistaAgenda>('semana');
  // Día y Semana van de lunes a sábado: un domingo arranca en el lunes siguiente.
  const [dia, setDia] = useState(() => diaDeAgenda(hoy));

  const consultas = [reservas, citas, prestamos];
  const cargando = consultas.some((consulta) => consulta.isPending);
  const conError = consultas.some((consulta) => consulta.isError);
  const recargando = consultas.some((consulta) => consulta.isRefetching);
  const recargar = () => consultas.forEach((consulta) => consulta.refetch());
  // Solo vuelve a pedir lo que falló.
  const reintentar = () => consultas.filter((consulta) => consulta.isError).forEach((consulta) => consulta.refetch());

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
  } else if (cargando) {
    contenido = <EstadoCarga mensaje="Cargando tu calendario…" />;
  } else if (conError) {
    contenido = <EstadoError mensaje="No pudimos cargar tu calendario." onReintentar={reintentar} />;
  } else {
    const { desde, hasta } = vista === 'mes' ? rangoMes(dia) : rangoSemana(dia);
    const todos = armarCompromisos({
      reservas: reservas.data ?? [],
      citas: citas.data ?? [],
      prestamos: prestamos.data ?? [],
      nombreEspacio: (id) => espacios?.find((espacio) => espacio.id === id)?.nombre ?? 'Espacio de la biblioteca',
    });
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
        recarga={usuario ? { recargando, onRecargar: recargar } : undefined}
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
