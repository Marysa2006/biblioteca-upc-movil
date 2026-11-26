import { GraficaIndicador } from '@/components/estadisticas/GraficaIndicador';
import type { Afluencia } from '@/utils/panel';

export function AfluenciaSemanal({ afluencia }: { afluencia: Afluencia }) {
  const datos =
    afluencia.pico == null
      ? []
      : afluencia.dias.map((dia) => ({
          etiqueta: dia.nombre,
          cantidad: dia.promedio,
        }));
  return (
    <GraficaIndicador
      clave="dashboard-afluencia"
      titulo="Afluencia semanal"
      descripcion={
        'Operaciones promedio por día en las últimas ' +
        afluencia.semanas +
        ' semanas' +
        (afluencia.pico ? '. El día de más uso es el ' + afluencia.pico + '.' : '.')
      }
      recomendada="lineas"
      datos={datos}
    />
  );
}
