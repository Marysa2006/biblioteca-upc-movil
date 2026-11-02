/**
 * Franjas de un tema de asesoría (HU-14): una semana a la vez, agrupadas por día.
 * - CA1: al tocar una franja, va a confirmar la cita.
 * - CA4: sin franjas, lo dice y sugiere la semana siguiente u otro tema.
 * - Con ?reprogramar=<citaId> (desde Mis citas), la franja elegida reemplaza la de esa cita;
 *   solo se ofrecen franjas del mismo tema y no se ofrece la que ya tiene.
 * Se consulta sin cuenta; la sesión se pide al confirmar.
 *
 * Patrón de datos: useTemas() / useFranjas() / useMisCitas() (src/hooks) → src/api → mock o API.
 */
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { ListaFranjas } from '@/components/asesorias/ListaFranjas';
import { NavegacionPeriodo } from '@/components/espacios/NavegacionPeriodo';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useFranjas, useMisCitas, useTemas } from '@/hooks/useAsesorias';
import type { FranjaAsesoria } from '@/types';
import { inicioSemana, rangoSemana, sumarDias, tituloSemana } from '@/utils/calendario';
import { fechaLegible, hoyISO } from '@/utils/fechas';

export default function FranjasTema() {
  const { temaId, reprogramar } = useLocalSearchParams<{ temaId: string; reprogramar?: string }>();
  const [hoy] = useState(hoyISO);
  const [dia, setDia] = useState(hoy);

  const { desde, hasta } = rangoSemana(dia);
  const temas = useTemas();
  const franjas = useFranjas(temaId, desde, hasta);
  // Sin reprogramar no hace falta: useMisCitas no consulta sin sesión, y la lista ya está en caché.
  const misCitas = useMisCitas();

  // Al volver de confirmar (por ejemplo, si la franja se ocupó, CA2), los cupos se consultan
  // de nuevo: la caché dura 5 minutos. cancelRefetch: false no repite una consulta en curso.
  const { refetch: refrescarFranjas } = franjas;
  useFocusEffect(
    useCallback(() => {
      refrescarFranjas({ cancelRefetch: false });
    }, [refrescarFranjas]),
  );

  const tema = temas.data?.find((t) => t.id === temaId);
  const cita = reprogramar ? misCitas.data?.find((c) => c.id === reprogramar) : undefined;
  const esperandoCita = reprogramar != null && misCitas.isPending;

  const reintentar = () => {
    if (temas.isError) temas.refetch();
    if (franjas.isError) franjas.refetch();
    if (misCitas.isError) misCitas.refetch();
  };

  const elegir = (franja: FranjaAsesoria) => {
    router.push({
      pathname: '/asesorias/confirmar',
      params: {
        temaId,
        franjaId: franja.id,
        fecha: franja.fecha,
        horaInicio: franja.horaInicio,
        horaFin: franja.horaFin,
        ...(reprogramar ? { reprogramar } : {}),
      },
    });
  };

  let contenido;
  if (temas.isPending || franjas.isPending || esperandoCita) {
    contenido = <EstadoCarga mensaje="Buscando franjas…" />;
  } else if (temas.isError || franjas.isError || (reprogramar && misCitas.isError)) {
    contenido = <EstadoError mensaje="No pudimos cargar las franjas." onReintentar={reintentar} />;
  } else if (!tema?.activo) {
    contenido = <EstadoVacio mensaje="Este tema ya no se ofrece. Elige otro tema de asesoría." />;
  } else if (reprogramar && !cita) {
    contenido = <EstadoVacio mensaje="No encontramos la cita que querías reprogramar." />;
  } else {
    const disponibles = cita ? franjas.data.filter((f) => f.id !== cita.franjaId) : franjas.data;
    contenido = (
      <ListaFranjas
        franjas={disponibles}
        onElegir={elegir}
        onSemanaSiguiente={() => setDia(sumarDias(inicioSemana(dia), 7))}
        onOtroTema={reprogramar ? undefined : () => router.back()}
      />
    );
  }

  const subtitulo = cita
    ? `Elige la nueva franja para tu cita del ${fechaLegible(cita.fecha)} a las ${cita.horaInicio}.`
    : 'Elige un día y una hora. Cada franja dice cuántos cupos quedan.';

  return (
    <>
      <EncabezadoApilado titulo={reprogramar ? 'Reprogramar asesoría' : 'Agendar asesoría'} />
      <Pantalla
        titulo={tema?.nombre ?? 'Asesoría'}
        subtitulo={subtitulo}
        conEncabezado
        recarga={{ recargando: franjas.isRefetching, onRecargar: () => franjas.refetch() }}
      >
        <NavegacionPeriodo
          vista="semana"
          titulo={tituloSemana(dia)}
          puedeAnterior={inicioSemana(dia) > inicioSemana(hoy)}
          onAnterior={() => setDia(sumarDias(inicioSemana(dia), -7))}
          onSiguiente={() => setDia(sumarDias(inicioSemana(dia), 7))}
        />
        {contenido}
      </Pantalla>
    </>
  );
}
