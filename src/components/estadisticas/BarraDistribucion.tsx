import { GraficaIndicador } from './GraficaIndicador';

type Props = {
  titulo: string;
  descripcion?: string;
  datos: { etiqueta: string; cantidad: number; color: string }[];
  total: number;
};

export function BarraDistribucion(props: Props) {
  return <GraficaIndicador {...props} recomendada="dona" />;
}
