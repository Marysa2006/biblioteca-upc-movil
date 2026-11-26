/**
 * Gestión: el trabajo del día a día del personal y la administración del portal.
 * Cada sección vive en su propio componente de src/components/gestion y se ve con su permiso:
 * - Solicitudes (`reservas`, `asesorias` o `formacion`): la bandeja de solicitudes de todos
 *   los servicios, filtrada por los permisos de cada persona (HU-19; luego asesorías y capacitaciones).
 * - Agenda (`asesorias`): las citas de asesoría por día y por semana (HU-15).
 * - Préstamos (`tablets`): la entrega y la devolución de tablets (HU-23), y los vencidos (HU-24)
 *   como un grupo más desde el #310. Con vencidos, la pestaña lleva cuántos y la alerta.
 *   Llegó de Inventario en el #162; sus componentes siguen en src/components/inventario.
 * - Portal (`contenidos`, `parametros`, `novedades`, `fotos` o `espacios`): en tres grupos,
 *   Publicaciones, Servicios (temas, líneas y, desde la revisión de la 1.1, Espacios, que antes
 *   era una sección de Gestión) y Configuración. Ver MenuAdministracion.
 * Una sección puede traer un botón flotante (Solicitudes: "Reservar para un tercero";
 * Préstamos: "Escanear tablet").
 * El nombre y los permisos de cada sección están en src/utils/gestion.ts.
 * El selector aparece solo con dos secciones o más. Esta pantalla solo compone: el contenido
 * de cada sección se cambia en su componente, no aquí.
 * Con `?seccion=` abre en esa sección (#306: las tarjetas del Dashboard llevan a Préstamos,
 * Agenda…); si la persona no la tiene, abre la primera que sí tenga, como sin el parámetro. El
 * Dashboard manda también `abrir` (la hora del toque): así, tocar dos veces la misma tarjeta vuelve
 * a abrir esa sección aunque la persona se haya movido a otra.
 */
import { Button, Snackbar } from 'react-native-paper';

import { useLocalSearchParams } from 'expo-router';
import { useState, type ComponentType } from 'react';

import { SeccionAgenda } from '@/components/gestion/SeccionAgenda';
import {
  BotonEscanearTablet,
  SeccionPrestamos,
} from '@/components/inventario/SeccionPrestamos';
import { SeccionPortal } from '@/components/gestion/SeccionPortal';
import { SeccionSolicitudes } from '@/components/gestion/SeccionSolicitudes';
import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { BotonReservaTercero } from '@/components/reservas/BotonReservaTercero';
import { EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useEnlacesKoha } from '@/hooks/useCatalogoKoha';
import { abrirEnNavegador } from '@/utils/navegador';
import { useRol } from '@/hooks/useRol';
import { usePrestamosVencidos } from '@/hooks/useTablets';
import {
  SECCIONES_GESTION,
  type InfoSeccionGestion,
  type ValorSeccionGestion,
} from '@/utils/gestion';

type ValorSeccion = ValorSeccionGestion;

type Seccion = InfoSeccionGestion & {
  Componente: ComponentType;
  /** Botón flotante de la sección, fijo abajo a la derecha (opcional); se encoge al deslizar. */
  Flotante?: ComponentType<{ extendido: boolean }>;
};

/**
 * El componente de cada sección. El nombre y los permisos están en SECCIONES_GESTION
 * (src/utils/gestion.ts), que también usa el tutorial del personal (#267).
 */
const COMPONENTES: Record<ValorSeccion, Pick<Seccion, 'Componente' | 'Flotante'>> = {
  solicitudes: { Componente: SeccionSolicitudes, Flotante: BotonReservaTercero },
  agenda: { Componente: SeccionAgenda },
  prestamos: { Componente: SeccionPrestamos, Flotante: BotonEscanearTablet },
  portal: { Componente: SeccionPortal },
};

const SECCIONES: Seccion[] = SECCIONES_GESTION.map((info) => ({
  ...info,
  ...COMPONENTES[info.valor],
}));

export default function Gestion() {
  const enlacesKoha = useEnlacesKoha();
  const kohaPersonal = enlacesKoha.isSuccess ? enlacesKoha.data.personal : null;
  const [errorKoha, setErrorKoha] = useState(false);
  const { tienePermiso } = useRol();
  const { seccion, abrir } = useLocalSearchParams<{ seccion?: string; abrir?: string }>();
  const pedida = SECCIONES.find((opcion) => opcion.valor === seccion)?.valor;
  const [elegida, setElegida] = useState<ValorSeccion>(pedida ?? 'solicitudes');
  // La pestaña sigue montada: cada vez que el Dashboard vuelve a pedir una sección, se cambia
  // aquí, durante el render y sin efecto (como usePaginacion).
  const pedido = `${pedida ?? ''}|${abrir ?? ''}`;
  const [pedidoPrevio, setPedidoPrevio] = useState(pedido);
  if (pedido !== pedidoPrevio) {
    setPedidoPrevio(pedido);
    if (pedida) setElegida(pedida);
  }
  // La misma consulta que el grupo Vencidos de Préstamos: la alerta a la administración se crea
  // apenas se abre Gestión.
  // Solo con el permiso `tablets`: la consulta crea avisos, y un facilitador o un gestor de
  // espacios también abren Gestión.
  const cantidadVencidos =
    usePrestamosVencidos({ activa: tienePermiso('tablets') }).data?.length ?? 0;

  const visibles = SECCIONES.filter((seccion) => seccion.permisos.some(tienePermiso)).map(
    (seccion) =>
      seccion.valor === 'prestamos' && cantidadVencidos > 0
        ? { ...seccion, cantidad: cantidadVencidos, alerta: true }
        : seccion,
  );
  // Si la elegida dejó de verse (o nunca se vio), se muestra la primera visible.
  const activa: Seccion | undefined =
    visibles.find((seccion) => seccion.valor === elegida) ?? visibles[0];
  const Flotante = activa?.Flotante;

  return (
    <Pantalla
      titulo="Gestión"
      subtitulo="Solicitudes, préstamos y administración del portal"
      flotante={Flotante ? (desplazada: boolean) => <Flotante extendido={!desplazada} /> : null}
    >
      {enlacesKoha.isError ? <EstadoError mensaje="No pudimos consultar el acceso a Koha." onReintentar={() => void enlacesKoha.refetch()} /> : kohaPersonal ? (
        <Button onPress={() => void abrirEnNavegador(kohaPersonal).catch(() => setErrorKoha(true))}>
          Ingresar a Koha
        </Button>
      ) : null}
      <Snackbar visible={errorKoha} onDismiss={() => setErrorKoha(false)}>
        No se pudo abrir Koha.
      </Snackbar>

      {activa && visibles.length > 1 ? (
        <SelectorSeccion opciones={visibles} valor={activa.valor} onCambiar={setElegida} />
      ) : null}

      {activa ? (
        <activa.Componente />
      ) : (
        <EstadoVacio mensaje="Tu rol no tiene secciones de gestión por ahora." />
      )}
    </Pantalla>
  );
}
