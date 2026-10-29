/** Tiempos mínimos y textos automáticos (HU-28). */
import { CampoParametro } from './CampoParametro';
import { TarjetaSeccion } from './TarjetaSeccion';

export function SeccionPlazos({ deshabilitado }: { deshabilitado: boolean }) {
  return (
    <>
      <TarjetaSeccion
        titulo="Tiempos mínimos"
        ayuda="Horas de anticipación, de 0 a 720. Escríbelas o ajústalas con − y +."
      >
        <CampoParametro
          nombre="horasMinimasSolicitud"
          etiqueta="Para solicitar un servicio (horas)"
          tipo="numero"
          minimo={0}
          maximo={720}
          deshabilitado={deshabilitado}
        />
        <CampoParametro
          nombre="horasMinimasCancelacion"
          etiqueta="Para cancelar una solicitud (horas)"
          tipo="numero"
          minimo={0}
          maximo={720}
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
