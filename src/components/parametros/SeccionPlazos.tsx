/** Tiempos mínimos y textos automáticos (HU-28). */
import { CampoParametro } from './CampoParametro';
import { TarjetaSeccion } from './TarjetaSeccion';

export function SeccionPlazos({ deshabilitado }: { deshabilitado: boolean }) {
  return (
    <>
      <TarjetaSeccion
        titulo="Tiempos mínimos"
        ayuda="Horas de anticipación, en números enteros de 0 a 720."
      >
        <CampoParametro
          nombre="horasMinimasSolicitud"
          etiqueta="Para solicitar un servicio (horas)"
          teclado="number-pad"
          largoMaximo={3}
          deshabilitado={deshabilitado}
        />
        <CampoParametro
          nombre="horasMinimasCancelacion"
          etiqueta="Para cancelar una solicitud (horas)"
          teclado="number-pad"
          largoMaximo={3}
          deshabilitado={deshabilitado}
        />
      </TarjetaSeccion>

      <TarjetaSeccion
        titulo="Textos automáticos"
        ayuda="Mensajes que recibe la comunidad en las comunicaciones automáticas."
      >
        <CampoParametro
          nombre="textoRecordatorio"
          etiqueta="Recordatorio"
          multilinea
          largoMaximo={300}
          deshabilitado={deshabilitado}
        />
        <CampoParametro
          nombre="textoCancelacion"
          etiqueta="Cancelación"
          multilinea
          largoMaximo={300}
          deshabilitado={deshabilitado}
        />
      </TarjetaSeccion>
    </>
  );
}
