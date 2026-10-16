import { EnConstruccion, Pantalla } from '@/components/ui';

export default function Estadisticas() {
  return (
    <Pantalla titulo="Estadísticas" subtitulo="Uso de los servicios de la biblioteca">
      <EnConstruccion
        hu="HU-25 y HU-26"
        descripcion="Registro del uso de cada servicio, indicadores con filtros y gráficos, y exportación de reportes."
      />
    </Pantalla>
  );
}
