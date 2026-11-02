/**
 * Catálogo de la comunidad: las fuentes de la biblioteca y sus guías, cada una en su pantalla
 * apilada para que sus búsquedas no se mezclen.
 * - Catálogo de la biblioteca, en Koha (HU-02): catalogo/koha.
 * - Repositorio institucional, en DSpace (HU-11): catalogo/repositorio.
 * - Recursos en línea, las fuentes académicas digitales (HU-03): catalogo/recursos-en-linea.
 * - Guías de la biblioteca, sin conexión (HU-29): guias.
 * No consulta datos: cada pantalla usa sus hooks. Por eso abre siempre, también sin internet,
 * y las guías guardadas quedan a un toque.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TarjetaFuente } from '@/components/catalogo/TarjetaFuente';
import { Pantalla } from '@/components/ui';
import { espacio } from '@/theme';

export default function Catalogo() {
  return (
    <Pantalla
      titulo="Catálogo"
      subtitulo="Material de la biblioteca, trabajos de la Universidad, recursos en línea y guías"
    >
      <View style={estilos.lista}>
        <TarjetaFuente
          icono="bookshelf"
          titulo="Catálogo de la biblioteca"
          descripcion="Libros, revistas y tesis impresas. Mira si hay ejemplares disponibles."
          onPress={() => router.push('/catalogo/koha')}
        />
        <TarjetaFuente
          icono="school-outline"
          titulo="Repositorio institucional"
          descripcion="Trabajos de grado e investigaciones de la Universidad, para leer y descargar."
          onPress={() => router.push('/catalogo/repositorio')}
        />
        <TarjetaFuente
          icono="database-outline"
          titulo="Recursos en línea"
          descripcion="Revistas, libros electrónicos y fuentes académicas para consultar desde cualquier lugar."
          onPress={() => router.push('/catalogo/recursos-en-linea')}
        />
        <TarjetaFuente
          icono="book-open-page-variant-outline"
          titulo="Guías de la biblioteca"
          marca={{ icono: 'cloud-off-outline', texto: 'Disponible sin conexión' }}
          descripcion="Cómo citar en APA, usar Mendeley y buscar en el catálogo, para leer aunque no tengas señal."
          onPress={() => router.push('/guias')}
        />
      </View>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espacio.s },
});
