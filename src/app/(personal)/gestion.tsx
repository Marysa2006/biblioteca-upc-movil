/**
 * Gestión: el trabajo del día a día del personal y la administración del portal.
 * - Solicitudes: aprobar, reprogramar o rechazar (HU-12 y HU-19, en construcción).
 * - Portal: contenidos (HU-04) y parámetros generales (HU-28), solo con su permiso.
 * Quien no tiene permisos del portal ve solo Solicitudes, sin el selector de sección.
 */
import { useState } from 'react';
import { SegmentedButtons } from 'react-native-paper';

import { MenuAdministracion, usePuedeAdministrarPortal } from '@/components/personal/MenuAdministracion';
import { EnConstruccion, Pantalla } from '@/components/ui';

type Seccion = 'solicitudes' | 'portal';

export default function Gestion() {
  const puedeAdministrar = usePuedeAdministrarPortal();
  const [seccion, setSeccion] = useState<Seccion>('solicitudes');
  const enPortal = puedeAdministrar && seccion === 'portal';

  return (
    <Pantalla titulo="Gestión" subtitulo="Solicitudes de los servicios y administración del portal">
      {puedeAdministrar ? (
        <SegmentedButtons
          value={seccion}
          onValueChange={(valor) => setSeccion(valor as Seccion)}
          buttons={[
            { value: 'solicitudes', label: 'Solicitudes' },
            { value: 'portal', label: 'Portal' },
          ]}
        />
      ) : null}

      {enPortal ? (
        <MenuAdministracion />
      ) : (
        <EnConstruccion
          hu="HU-12 y HU-19"
          descripcion="Aprobar, proponer otra fecha o rechazar reservas y solicitudes de formación."
        />
      )}
    </Pantalla>
  );
}
