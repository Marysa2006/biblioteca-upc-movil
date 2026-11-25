/**
 * El teclado en los formularios (#293). Con `react-native-keyboard-controller`:
 * - ScrollViewTeclado (KeyboardAwareScrollView) sube solo el campo que se escribe, justo encima
 *   del teclado y de la barra;
 * - BarraTeclado (KeyboardToolbar) va sobre el teclado con Anterior, Siguiente y Listo, en
 *   español (también para el lector de pantalla).
 *
 * Expo Go no trae el módulo nativo de esta librería («The Keyboard Controller library is not
 * included in Expo Go», guía de Expo). Por eso solo se carga si el módulo existe en la app que
 * corre (el APK o un development build); si no, `tecladoNativo` es false y Pantalla usa
 * KeyboardAvoidingView con 'padding', que sirve en Expo Go. No se usa ExecutionEnvironment: su
 * StoreClient incluye Expo Go y los development builds por igual.
 */
import type { ComponentType, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TurboModuleRegistry,
  type GestureResponderEvent,
  type TurboModule,
  type ViewStyle,
} from 'react-native';

import { espacio } from '@/theme';

type Libreria = typeof import('react-native-keyboard-controller');

/** El módulo nativo de la librería está en esta app (APK o development build, no Expo Go). */
export const tecladoNativo = TurboModuleRegistry.get<TurboModule>('KeyboardController') != null;

// Se carga solo con el módulo nativo: en Expo Go, sus vistas nativas no existen.
const libreria: Libreria | null = tecladoNativo
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react-native-keyboard-controller') as Libreria)
  : null;

/**
 * Lo que deja la librería entre el campo y el teclado: el alto de la barra (unos 42 px) más un
 * margen, para que el campo no quede pegado a ella.
 */
export const SEPARACION_TECLADO = espacio.xl * 2;

/** El KeyboardAwareScrollView de la librería, o null en Expo Go. */
export const ScrollViewTeclado = libreria?.KeyboardAwareScrollView ?? null;

/** Envuelve la app (src/app/_layout.tsx). En Expo Go no hace nada. */
export function ProveedorTeclado({ children }: { children: ReactNode }) {
  if (!libreria) return <>{children}</>;
  const { KeyboardProvider } = libreria;
  // preload={false}: sin el parpadeo del teclado al abrir la app (documentación de la librería).
  return <KeyboardProvider preload={false}>{children}</KeyboardProvider>;
}

/** Lo que recibe cada botón de la barra (el `button` de KeyboardToolbar.Prev/Next/Done). */
type PropsBotonBarra = {
  children?: ReactNode;
  disabled?: boolean;
  onPress: (evento: GestureResponderEvent) => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  testID: string;
  rippleRadius?: number;
  style?: ViewStyle;
};

/** La librería trae las etiquetas en inglés; aquí van en español, según el botón. */
const ETIQUETAS: Record<string, { etiqueta: string; ayuda: string }> = {
  'keyboard.toolbar.previous': { etiqueta: 'Anterior', ayuda: 'Pasa al campo anterior' },
  'keyboard.toolbar.next': { etiqueta: 'Siguiente', ayuda: 'Pasa al campo siguiente' },
  'keyboard.toolbar.done': { etiqueta: 'Listo', ayuda: 'Cierra el teclado' },
};

function BotonBarra({
  children,
  disabled,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: PropsBotonBarra) {
  const textos = ETIQUETAS[testID];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[estilos.boton, style]}
      hitSlop={espacio.s}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={textos?.etiqueta ?? accessibilityLabel}
      accessibilityHint={textos?.ayuda ?? accessibilityHint}
    >
      {children}
    </Pressable>
  );
}

/** La barra sobre el teclado: Anterior, Siguiente y Listo. En Expo Go no se muestra. */
export function BarraTeclado() {
  if (!libreria) return null;
  const { KeyboardToolbar } = libreria;
  // El tipo del `button` es el botón interno de la librería; BotonBarra recibe las mismas props.
  const boton = BotonBarra as unknown as ComponentType;
  return (
    <KeyboardToolbar>
      <KeyboardToolbar.Prev button={boton as never} />
      <KeyboardToolbar.Next button={boton as never} />
      <KeyboardToolbar.Done text="Listo" button={boton as never} />
    </KeyboardToolbar>
  );
}

const estilos = StyleSheet.create({
  // Área táctil de 44×44 como mínimo, aunque el ícono sea más pequeño.
  boton: {
    minWidth: espacio.xl + espacio.s + espacio.xs,
    minHeight: espacio.xl + espacio.s + espacio.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
