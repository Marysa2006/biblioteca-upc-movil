/**
 * Solicitar la reserva de un espacio (HU-18). PROVISIONAL: HU-17 llega aquí al tocar una
 * franja disponible, con la fecha y la hora en la ruta; HU-18 reemplaza esta pantalla por el
 * formulario (fecha, horario, propósito y asistentes).
 */
import { useLocalSearchParams } from 'expo-router';

import { EncabezadoApilado, EnConstruccion, Pantalla } from '@/components/ui';
import { useEspacios } from '@/hooks/useEspacios';
import { fechaCompleta } from '@/utils/calendario';

export default function ReservarEspacio() {
  const { id, fecha, hora } = useLocalSearchParams<{ id: string; fecha?: string; hora?: string }>();
  const { data: espacios } = useEspacios();
  const nombre = espacios?.find((e) => e.id === id)?.nombre ?? 'el espacio';
  const cuando = fecha && hora ? ` el ${fechaCompleta(fecha).toLowerCase()} a las ${hora}` : '';

  return (
    <>
      <EncabezadoApilado titulo="Solicitar reserva" />
      <Pantalla titulo="Solicitar reserva" conEncabezado>
        <EnConstruccion hu="HU-18" descripcion={`Aquí podrás solicitar ${nombre}${cuando}.`} />
      </Pantalla>
    </>
  );
}
