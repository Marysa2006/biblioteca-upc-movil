import type { ReactNode } from 'react';

import type { ConteoIndicador } from '@/types';

import { GraficaIndicador } from './GraficaIndicador';

type Props = {
  titulo: string;
  descripcion?: string;
  datos: ConteoIndicador[];
  selector?: ReactNode;
  nombreAccesible?: (etiqueta: string) => string;
};

export function ColumnasMes(props: Props) {
  return <GraficaIndicador {...props} recomendada="lineas" />;
}
