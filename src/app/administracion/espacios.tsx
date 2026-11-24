/**
 * Espacios (HU-16 y HU-20), desde Gestión → Portal → Servicios (revisión de la 1.1). Antes era una
 * pestaña de Gestión; ahora va junto a los temas de asesoría y las líneas de formación, que también
 * configuran lo que la comunidad puede solicitar. El contenido es el mismo: SeccionEspacios, con
 * el botón flotante "Nuevo espacio". Solo con el permiso `espacios`.
 */
import { BotonNuevoEspacio, SeccionEspacios } from '@/components/gestion/SeccionEspacios';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { EncabezadoApilado, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';

const TITULO = 'Espacios';

export default function AdministrarEspacios() {
  const { tienePermiso } = useRol();
  const puede = tienePermiso('espacios');

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Los espacios que se pueden reservar y sus bloqueos"
        conEncabezado
        flotante={
          puede ? (desplazada: boolean) => <BotonNuevoEspacio extendido={!desplazada} /> : null
        }
      >
        {puede ? <SeccionEspacios /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}
