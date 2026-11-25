import type { FirmaElectronica } from '@/types';

export type FirmaBackend = { path: string; width: number; height: number; signed_at: string };

export function firmaDesdeBackend(firma?: FirmaBackend | null): FirmaElectronica | undefined {
  return firma ? {
    trazo: firma.path,
    ancho: firma.width,
    alto: firma.height,
    fechaHora: firma.signed_at.slice(0, 10) + ' ' + firma.signed_at.slice(11, 16),
  } : undefined;
}

export function firmaHaciaBackend(firma: FirmaElectronica | null): FirmaBackend | null {
  return firma ? {
    path: firma.trazo,
    width: firma.ancho,
    height: firma.alto,
    signed_at: firma.fechaHora.replace(' ', 'T') + ':00-05:00',
  } : null;
}
