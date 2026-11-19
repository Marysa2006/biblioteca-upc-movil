/**
 * La constancia de un préstamo de tablet, con ?id=<préstamo> (HU-23, versión 1.1, #253).
 * Se abre desde Gestión → Préstamos con "Ver constancia": se puede consultar después de la
 * entrega y, ya cerrada, con quién entregó y quién recibió. Se comparte en PDF.
 * Solo con el permiso `tablets`.
 *
 * Patrón de datos: useConstancia() / useCompartirConstancia() (src/hooks) → src/api → mock o API.
 */
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BotonCompartirConstancia } from '@/components/inventario/BotonCompartirConstancia';
import { VistaConstancia } from '@/components/inventario/VistaConstancia';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { useConstancia } from '@/hooks/useTablets';
import { espacio } from '@/theme';

const TITULO = 'Constancia del préstamo';

export default function ConstanciaPrestamo() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla titulo={TITULO} conEncabezado>
        {!tienePermiso('tablets') ? (
          <SinPermiso />
        ) : id ? (
          <Contenido id={id} />
        ) : (
          <EstadoVacio mensaje="Elige un préstamo desde Gestión → Préstamos." />
        )}
      </Pantalla>
    </>
  );
}

function Contenido({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useConstancia(id);

  if (isPending) return <EstadoCarga mensaje="Cargando la constancia…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar la constancia." onReintentar={() => refetch()} />;
  }

  return (
    <View style={estilos.contenido}>
      <VistaConstancia constancia={data} />
      <BotonCompartirConstancia constancia={data} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacio.m },
});
