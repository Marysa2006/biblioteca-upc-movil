/**
 * DATOS DE PRUEBA de las fotos del carrusel de Inicio (#290): las tres fotos que trae el APK
 * (#164), publicadas y en su orden. Las nuevas que se agregan desde la app quedan con la ruta
 * de la foto en el celular mientras no exista el recurso del Backend.
 */
import type { FotoInicio } from '@/types';
import { FOTOS_INICIO_APP } from '@/utils/inicio';

export const FOTOS_INICIO: FotoInicio[] = FOTOS_INICIO_APP.map((foto) => ({ ...foto }));
