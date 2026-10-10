import { EnConstruccion, Pantalla } from '@/components/ui';

export default function Bandeja() {
  return (
    <Pantalla titulo="Bandeja de entrada" subtitulo="Solicitudes por revisar">
      <EnConstruccion hu="HU-12 y HU-19" descripcion="Aprobar, proponer otra fecha o rechazar reservas y solicitudes de formación." />
    </Pantalla>
  );
}
