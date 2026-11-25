/**
 * Semestre del estudiante (#203): una lista desplegable del 1.º al 10.º y «Otro». Con «Otro»
 * aparece un campo − y + desde el 11, porque hay estudiantes que pasan del 10.º. El tope
 * (SEMESTRE_MAXIMO) no se muestra: solo evita un error de dedo (#251).
 * El valor es el número como texto ('' sin elegir), igual que en las reglas del #224.
 * Mismo aspecto que SelectorCategoria: un campo que, al tocarlo, abre un menú.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Icon, Menu, Text, TouchableRipple } from 'react-native-paper';

import { CampoNumerico } from '@/components/ui';
import { colores, espacio, fuentes, radio } from '@/theme';
import { SEMESTRE_MAXIMO, SEMESTRES } from '@/utils/constantes';

type Props = {
  valor: string;
  onCambiar: (valor: string) => void;
  mensajeError?: string;
  deshabilitado?: boolean;
};

/** Los que salen en la lista: del 1 al 10. */
const EN_LISTA = SEMESTRES.map((_, i) => i + 1);
const PRIMERO_OTRO = EN_LISTA.length + 1;

const nombreSemestre = (numero: number) => `${numero}.º semestre`;

export function SelectorSemestre({ valor, onCambiar, mensajeError, deshabilitado = false }: Props) {
  const [abierto, setAbierto] = useState(false);
  // «Otro» se elige aunque todavía no haya número: así aparece el campo.
  const [otroElegido, setOtroElegido] = useState(false);
  const numero = valor ? Number(valor) : null;
  const esOtro = otroElegido || (numero != null && numero >= PRIMERO_OTRO);

  let texto = 'Elige tu semestre';
  if (esOtro) texto = 'Otro';
  else if (numero != null) texto = nombreSemestre(numero);

  const elegir = (semestre: number | 'otro') => {
    setAbierto(false);
    if (semestre === 'otro') {
      setOtroElegido(true);
      if (numero == null || numero < PRIMERO_OTRO) onCambiar(String(PRIMERO_OTRO));
    } else {
      setOtroElegido(false);
      onCambiar(String(semestre));
    }
  };

  const error = mensajeError != null;
  const campo = (
    <View
      style={[
        estilos.campo,
        error ? estilos.campoError : null,
        deshabilitado && estilos.campoDeshabilitado,
      ]}
    >
      <TouchableRipple
        onPress={() => setAbierto(true)}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={`Semestre: ${texto}. Cambiar semestre`}
        accessibilityState={{ disabled: deshabilitado, expanded: abierto }}
      >
        <View style={estilos.contenido}>
          <Text
            variant="bodyLarge"
            style={numero == null && !esOtro ? estilos.vacio : estilos.nombre}
          >
            {texto}
          </Text>
          <Icon
            source={abierto ? 'menu-up' : 'menu-down'}
            size={24}
            color={colores.textoSecundario}
          />
        </View>
      </TouchableRipple>
    </View>
  );

  return (
    <View style={estilos.grupo}>
      <Text variant="bodyMedium" style={estilos.etiqueta}>
        Semestre
      </Text>
      <Menu
        visible={abierto}
        onDismiss={() => setAbierto(false)}
        anchor={campo}
        anchorPosition="bottom"
        contentStyle={estilos.menu}
      >
        {EN_LISTA.map((semestre) => {
          const elegido = !esOtro && semestre === numero;
          return (
            <Menu.Item
              key={semestre}
              title={nombreSemestre(semestre)}
              trailingIcon={elegido ? 'check' : undefined}
              onPress={() => elegir(semestre)}
              titleStyle={elegido ? estilos.itemElegido : undefined}
              accessibilityLabel={`${nombreSemestre(semestre)}${elegido ? ', elegido' : ''}`}
            />
          );
        })}
        <Menu.Item
          title="Otro"
          trailingIcon={esOtro ? 'check' : undefined}
          onPress={() => elegir('otro')}
          titleStyle={esOtro ? estilos.itemElegido : undefined}
          accessibilityLabel={`Otro semestre${esOtro ? ', elegido' : ''}`}
        />
      </Menu>
      {esOtro ? (
        <CampoNumerico
          etiqueta="¿En qué semestre estás?"
          valor={valor}
          onCambiar={onCambiar}
          minimo={PRIMERO_OTRO}
          maximo={SEMESTRE_MAXIMO}
          deshabilitado={deshabilitado}
        />
      ) : null}
      <View accessibilityLiveRegion="polite">
        <HelperText type="error" visible={error}>
          {mensajeError}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.xs },
  etiqueta: { color: colores.texto },
  // Mismo borde que los campos de texto; overflow: 'hidden' recorta el ripple.
  campo: {
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: radio.boton,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  campoError: { borderColor: colores.error },
  campoDeshabilitado: { opacity: 0.6 },
  // minHeight: el campo mide como un TextInput y crece con la letra.
  contenido: {
    minHeight: espacio.xl + espacio.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  nombre: { flex: 1, color: colores.texto },
  vacio: { flex: 1, color: colores.textoSecundario },
  menu: { backgroundColor: colores.superficie },
  itemElegido: { color: colores.primario, fontFamily: fuentes.seminegrita },
});
