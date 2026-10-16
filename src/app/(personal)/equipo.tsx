/**
 * Personal (HU-07): la administración de la biblioteca asigna o retira los roles del personal.
 * Solo con el permiso 'roles' (la bibliotecóloga); el resto del personal ve un aviso.
 *
 * Dos secciones: "Personal de la biblioteca" (quienes tienen algún rol, con filtro por rol)
 * y "Usuarios" (todas las cuentas, con filtro por tipo de usuario), más el buscador.
 * La propia tarjeta no aparece: nadie puede quitarse su propio rol (CA4).
 *
 * Patrón de datos: useUsuarios() / useActualizarRolesPersonal() (src/hooks) → src/api/usuarios.ts
 * → mock o API.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Searchbar, SegmentedButtons, Snackbar } from 'react-native-paper';

import { DialogoRolesPersonal } from '@/components/personal/DialogoRolesPersonal';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { TarjetaUsuario } from '@/components/personal/TarjetaUsuario';
import {
  ChipsFiltro,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
  type OpcionFiltro,
} from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { useActualizarRolesPersonal, useUsuarios } from '@/hooks/useUsuarios';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { RolPersonal, TipoUsuario, Usuario } from '@/types';
import {
  esPersonal,
  NOMBRE_ROL_PERSONAL,
  NOMBRE_TIPO,
  ROLES_PERSONAL,
  tieneRol,
} from '@/utils/roles';

/** Tiempo que se ve el aviso del cambio de rol. */
const DURACION_AVISO_MS = 4000;

type Seccion = 'personal' | 'usuarios';
type FiltroRol = RolPersonal | 'todos';
type FiltroTipo = TipoUsuario | 'todos';

/** Tipos de usuario con cuenta (los visitantes no tienen). */
const TIPOS_CON_CUENTA: TipoUsuario[] = ['estudiante', 'docente', 'administrativo', 'egresado'];

/** Normaliza para buscar sin importar mayúsculas ni tildes. */
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function Equipo() {
  const { tienePermiso } = useRol();

  if (!tienePermiso('roles')) {
    return (
      <Pantalla titulo="Personal" subtitulo="Usuarios y roles del personal">
        <SinPermiso />
      </Pantalla>
    );
  }

  return <GestionRoles />;
}

function GestionRoles() {
  const { usuario: yo } = useRol();
  const { data: usuarios, isPending, isError, isRefetching, refetch } = useUsuarios();
  const { mutate, isPending: guardando, error, reset } = useActualizarRolesPersonal();

  const [seccion, setSeccion] = useState<Seccion>('personal');
  const [filtroRol, setFiltroRol] = useState<FiltroRol>('todos');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const abrir = (usuario: Usuario) => {
    reset();
    setEditando(usuario);
  };

  const cerrar = () => {
    reset();
    setEditando(null);
  };

  const confirmar = (rolesPersonal: RolPersonal[]) => {
    if (!editando) return;
    const persona = editando;
    mutate(
      { usuarioId: persona.id, rolesPersonal },
      {
        onSuccess: () => {
          setEditando(null);
          setAviso(
            rolesPersonal.length > 0
              ? `${persona.nombre} ahora tiene: ${rolesPersonal
                  .map((rol) => NOMBRE_ROL_PERSONAL[rol])
                  .join(', ')}.`
              : `${persona.nombre} ya no tiene roles del personal.`,
          );
        },
      },
    );
  };

  let filtros = null;
  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando usuarios…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar los usuarios." onReintentar={() => refetch()} />;
  } else {
    // HU-07, CA4: la propia tarjeta no aparece, así que no hay forma de quitarse el propio rol.
    const otros = usuarios.filter((u) => u.id !== yo?.id);
    const personal = otros.filter((u) => esPersonal(u));

    let base: Usuario[];
    if (seccion === 'personal') {
      // Solo los roles que tiene alguien de la lista, en el orden de ROLES_PERSONAL.
      const opciones: OpcionFiltro<FiltroRol>[] = [
        { valor: 'todos', etiqueta: 'Todos', cantidad: personal.length },
        ...ROLES_PERSONAL.map((rol) => ({
          valor: rol,
          etiqueta: NOMBRE_ROL_PERSONAL[rol],
          cantidad: personal.filter((u) => tieneRol(u, rol)).length,
        })).filter((opcion) => opcion.cantidad > 0),
      ];
      // Si el rol elegido se queda sin personas (por ejemplo, tras un cambio), vuelve a "Todos".
      const valor = opciones.some((o) => o.valor === filtroRol) ? filtroRol : 'todos';
      filtros = (
        <ChipsFiltro
          opciones={opciones}
          valor={valor}
          onCambiar={setFiltroRol}
          descripcion="Filtrar el personal por rol"
        />
      );
      base = valor === 'todos' ? personal : personal.filter((u) => tieneRol(u, valor));
    } else {
      const opciones: OpcionFiltro<FiltroTipo>[] = [
        { valor: 'todos', etiqueta: 'Todos', cantidad: otros.length },
        ...TIPOS_CON_CUENTA.map((tipo) => ({
          valor: tipo,
          etiqueta: NOMBRE_TIPO[tipo],
          cantidad: otros.filter((u) => u.tipo === tipo).length,
        })).filter((opcion) => opcion.cantidad > 0),
      ];
      const valor = opciones.some((o) => o.valor === filtroTipo) ? filtroTipo : 'todos';
      filtros = (
        <ChipsFiltro
          opciones={opciones}
          valor={valor}
          onCambiar={setFiltroTipo}
          descripcion="Filtrar los usuarios por tipo"
        />
      );
      base = valor === 'todos' ? otros : otros.filter((u) => u.tipo === valor);
    }

    const texto = normalizar(busqueda.trim());
    const encontrados = texto
      ? base.filter(
          (u) => normalizar(u.nombre).includes(texto) || normalizar(u.correo).includes(texto),
        )
      : base;

    if (encontrados.length === 0) {
      let mensaje: string;
      if (texto) {
        // CA3: el usuario buscado no existe.
        mensaje = `No encontramos a ningún usuario con «${busqueda.trim()}».`;
      } else if (seccion === 'personal') {
        mensaje = 'Todavía no hay personal con roles asignados.';
      } else {
        mensaje = 'Todavía no hay usuarios registrados.';
      }
      lista = <EstadoVacio mensaje={mensaje} />;
    } else {
      lista = encontrados.map((usuario) => (
        <TarjetaUsuario key={usuario.id} usuario={usuario} onCambiarRol={() => abrir(usuario)} />
      ));
    }
  }

  return (
    <Pantalla
      titulo="Personal"
      subtitulo="Asigna o retira los roles del personal de la biblioteca. Una persona puede tener varios."
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      <SegmentedButtons
        value={seccion}
        onValueChange={(valor) => setSeccion(valor as Seccion)}
        style={estilos.secciones}
        buttons={[
          { value: 'personal', label: 'Personal de la biblioteca' },
          { value: 'usuarios', label: 'Usuarios' },
        ]}
      />
      <Searchbar
        placeholder="Buscar por nombre o correo"
        value={busqueda}
        onChangeText={setBusqueda}
        style={estilos.buscador}
        inputStyle={estilos.textoBuscador}
        accessibilityLabel="Buscar usuario por nombre o correo"
        // Paper trae estos labels en inglés ("search" y "clear").
        searchAccessibilityLabel="Buscar"
        clearAccessibilityLabel="Borrar búsqueda"
      />
      {filtros}
      <View style={estilos.lista}>{lista}</View>

      <DialogoRolesPersonal
        usuario={editando}
        guardando={guardando}
        // El error de CA4 lo da useActualizarRolesPersonal() antes de llamar a la API.
        mensajeError={error ? error.message : null}
        onConfirmar={confirmar}
        onCerrar={cerrar}
      />
      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </Pantalla>
  );
}

const estilos = StyleSheet.create({
  secciones: { marginTop: espacio.s },
  buscador: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  textoBuscador: { fontFamily: fuentes.regular },
  lista: { gap: espacio.s },
});
