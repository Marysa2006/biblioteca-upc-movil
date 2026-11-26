import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { claves } from '@/api/claves';
import { ErrorApi } from '@/api/cliente';
import { buscarPersonas, type ModuloBusquedaPersonas } from '@/api/usuarios';
import { useSesion } from '@/store/sesion';

function esErrorDePermiso(error: unknown): boolean {
  return error instanceof ErrorApi && error.estado === 403;
}

export function useBuscarPersonas(modulo: ModuloBusquedaPersonas, texto: string, activa: boolean) {
  const cuenta = useSesion((estado) => estado.usuario?.id);
  const termino = texto.trim();
  const [busqueda, setBusqueda] = useState('');
  const [cuentaSinPermiso, setCuentaSinPermiso] = useState<string>();
  const actual = termino === busqueda;
  const consulta = useInfiniteQuery({
    queryKey: claves.buscarPersonas(cuenta ?? '', modulo, busqueda),
    queryFn: ({ pageParam }) =>
      buscarPersonas(modulo, busqueda, pageParam).catch((error: unknown) => {
        if (esErrorDePermiso(error)) setCuentaSinPermiso(cuenta);
        throw error;
      }),
    initialPageParam: 1,
    getNextPageParam: (pagina, _, numero) => (pagina.hayMas ? numero + 1 : undefined),
    enabled: activa && !!cuenta && cuentaSinPermiso !== cuenta && termino.length >= 3 && actual,
    retry: (intentos, error) => !esErrorDePermiso(error) && intentos < 2,
  });
  const denegado = esErrorDePermiso(consulta.error);

  useEffect(() => {
    const espera = setTimeout(() => setBusqueda(termino), 300);
    return () => clearTimeout(espera);
  }, [termino]);

  return {
    ...consulta,
    sinPermiso: denegado || (!!cuenta && cuentaSinPermiso === cuenta),
    buscando: termino.length >= 3 && (!actual || consulta.isPending),
    personas: actual ? consulta.data?.pages.flatMap((pagina) => pagina.elementos) ?? [] : [],
    error: actual ? consulta.error : null,
  };
}
