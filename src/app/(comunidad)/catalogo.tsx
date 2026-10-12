import { TarjetaCatalogoKoha } from '@/components/catalogo/TarjetaCatalogoKoha';
import { EnConstruccion, Pantalla } from '@/components/ui';
import { useCatalogoKoha } from '@/hooks/useCatalogoKoha';

export default function Catalogo() {
  const { estado, abrirCatalogo } = useCatalogoKoha();

  return (
    <Pantalla titulo="Catálogo" subtitulo="Material de la biblioteca y bases de datos académicas">
      <TarjetaCatalogoKoha estado={estado} onAbrir={abrirCatalogo} />
      <EnConstruccion hu="HU-03" descripcion="Bases de datos académicas suscritas por la biblioteca." />
    </Pantalla>
  );
}
