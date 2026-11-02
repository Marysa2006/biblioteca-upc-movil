/**
 * Selector de secciones de Gestión e Inventario: pestañas subrayadas que se deslizan de lado
 * (PestanasFiltro). La elegida va en negrita, con el color de marca y una línea debajo.
 * Se distinguen de los chips con los que cada sección filtra su lista.
 */
import { PestanasFiltro } from '@/components/ui';

/** La cantidad es opcional: Inventario la usa para los vencidos. */
export type OpcionSeccion<T extends string> = {
  valor: T;
  etiqueta: string;
  cantidad?: number;
};

type Props<T extends string> = {
  opciones: OpcionSeccion<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Lo que lee el lector de pantalla para la fila; por defecto, el de Gestión. */
  etiqueta?: string;
};

export function SelectorSeccion<T extends string>({
  opciones,
  valor,
  onCambiar,
  etiqueta = 'Secciones de Gestión',
}: Props<T>) {
  return (
    <PestanasFiltro opciones={opciones} valor={valor} onCambiar={onCambiar} descripcion={etiqueta} />
  );
}
