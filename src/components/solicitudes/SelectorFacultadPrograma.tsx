/**
 * Facultad y programa en listas desplegables (#251), con «Otro programa» para escribirlo. Lo usan
 * «Tus datos» de las solicitudes (SeccionDatosSolicitante) y el registro (#294), para que los dos
 * ofrezcan las mismas facultades y programas (PROGRAMAS_POR_FACULTAD).
 * - Al cambiar de facultad, el programa que no es de ella se borra.
 * - Una facultad o un programa de la cuenta que no está en la lista se conserva: la facultad se
 *   suma a las opciones y el programa queda en «Otro programa».
 * Es controlado: recibe los valores y los errores, y avisa con onCambiarFacultad y
 * onCambiarPrograma.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';

import { CampoDesplegable } from '@/components/ui';
import { colores } from '@/theme';
import { FACULTADES, PROGRAMAS_POR_FACULTAD } from '@/utils/constantes';
import { LARGO_MAXIMO_DATO_ACADEMICO } from '@/utils/solicitante';

/** La última opción de cada facultad: abre un campo para escribir el programa. */
const OTRO_PROGRAMA = 'Otro programa';

type Props = {
  facultad: string;
  programa: string;
  onCambiarFacultad: (facultad: string) => void;
  onCambiarPrograma: (programa: string) => void;
  errorFacultad?: string;
  errorPrograma?: string;
  /** Agrega « (opcional)» a las etiquetas, para quien no es estudiante. */
  opcional?: boolean;
  deshabilitado?: boolean;
};

export function SelectorFacultadPrograma({
  facultad,
  programa,
  onCambiarFacultad,
  onCambiarPrograma,
  errorFacultad,
  errorPrograma,
  opcional = false,
  deshabilitado = false,
}: Props) {
  const sufijo = opcional ? ' (opcional)' : '';
  // La facultad de la cuenta que no está en la lista también se ofrece, para no perderla.
  const facultades =
    facultad && !FACULTADES.includes(facultad) ? [...FACULTADES, facultad] : FACULTADES;
  const programas = PROGRAMAS_POR_FACULTAD[facultad] ?? [];
  // «Otro programa»: elegido a mano, o un programa de la cuenta que no está en la lista.
  const [otroElegido, setOtroElegido] = useState(false);
  const otroPrograma = otroElegido || (programa !== '' && !programas.includes(programa));

  const elegirFacultad = (nueva: string) => {
    onCambiarFacultad(nueva);
    const nuevos = PROGRAMAS_POR_FACULTAD[nueva] ?? [];
    if (programa && !nuevos.includes(programa)) onCambiarPrograma('');
    setOtroElegido(false);
  };

  const elegirPrograma = (elegido: string) => {
    if (elegido === OTRO_PROGRAMA) {
      setOtroElegido(true);
      if (programas.includes(programa)) onCambiarPrograma('');
      return;
    }
    setOtroElegido(false);
    onCambiarPrograma(elegido);
  };

  return (
    <>
      {/* Desplegables y no chips: los nombres son largos; el menú los muestra sin cortarlos. */}
      <CampoDesplegable
        etiqueta={`Facultad${sufijo}`}
        nombre="Facultad"
        opciones={facultades}
        valor={facultad}
        onCambiar={elegirFacultad}
        textoVacio="Elige tu facultad"
        mensajeError={errorFacultad}
        deshabilitado={deshabilitado}
      />

      <CampoDesplegable
        etiqueta={`Programa${sufijo}`}
        nombre="Programa"
        opciones={[...programas, OTRO_PROGRAMA]}
        valor={otroPrograma ? OTRO_PROGRAMA : programa}
        onCambiar={elegirPrograma}
        textoVacio={facultad ? 'Elige tu programa' : 'Elige primero la facultad'}
        // Con «Otro programa», el error va bajo el campo de texto.
        mensajeError={otroPrograma ? undefined : errorPrograma}
        deshabilitado={deshabilitado || !facultad}
      />

      {otroPrograma ? (
        <View>
          <TextInput
            mode="outlined"
            label="Escribe tu programa"
            value={programa}
            onChangeText={onCambiarPrograma}
            error={errorPrograma != null}
            disabled={deshabilitado}
            autoCorrect={false}
            maxLength={LARGO_MAXIMO_DATO_ACADEMICO}
            style={estilos.campo}
            accessibilityLabel="Escribe tu programa"
          />
          <View accessibilityLiveRegion="polite">
            <HelperText type={errorPrograma ? 'error' : 'info'} visible>
              {errorPrograma ?? 'Por ejemplo, un posgrado o tu dependencia.'}
            </HelperText>
          </View>
        </View>
      ) : null}
    </>
  );
}

const estilos = StyleSheet.create({
  campo: { backgroundColor: colores.superficie },
});
