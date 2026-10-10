import { EnConstruccion, Pantalla } from '@/components/ui';

export default function Catalogo() {
  return (
    <Pantalla titulo="Catálogo" subtitulo="Libros y material de la biblioteca">
      <EnConstruccion hu="HU-02 y HU-03" descripcion="Acceso al catálogo de Koha y a las bases de datos académicas." />
    </Pantalla>
  );
}
