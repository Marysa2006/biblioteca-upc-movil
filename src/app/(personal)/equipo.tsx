/**
 * Personal (HU-07): la administración de la biblioteca asigna o retira los roles del personal,
 * y entra a las demás funciones de administración (menú "Administración", HU-04 y HU-28).
 * Solo con el permiso 'roles' (la bibliotecóloga); el resto del personal ve un aviso.
 *
 * Patrón de datos: useUsuarios() / useActualizarRolesPersonal() (src/hooks) → src/api/usuarios.ts → mock o API.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Searchbar, Snackbar, Text } from 'react-native-paper';

import { DialogoRolesPersonal } from '@/components/personal/DialogoRolesPersonal';
import { MenuAdministracion } from '@/components/personal/MenuAdministracion';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { TarjetaUsuario } from '@/components/personal/TarjetaUsuario';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { useActualizarRolesPersonal, useUsuarios } from '@/hooks/useUsuarios';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { RolPersonal, Usuario } from '@/types';
import { NOMBRE_ROL_PERSONAL } from '@/utils/roles';

/** Tiempo que se ve el aviso del cambio de rol. */
const DURACION_AVISO_MS = 4000;

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

  let lista;
  if (isPending) {
    lista = <EstadoCarga mensaje="Cargando usuarios…" />;
  } else if (isError) {
    lista = <EstadoError mensaje="No pudimos cargar los usuarios." onReintentar={() => refetch()} />;
  } else {
    const texto = normalizar(busqueda.trim());
    const encontrados = texto
      ? usuarios.filter(
          (u) => normalizar(u.nombre).includes(texto) || normalizar(u.correo).includes(texto),
        )
      : usuarios;

    if (encontrados.length === 0) {
      // CA3: el usuario buscado no existe.
      lista = (
        <EstadoVacio
          mensaje={
            texto
              ? `No encontramos a ningún usuario con «${busqueda.trim()}».`
              : 'Todavía no hay usuarios registrados.'
          }
        />
      );
    } else {
      lista = encontrados.map((usuario) => (
        <TarjetaUsuario
          key={usuario.id}
          usuario={usuario}
          esUstedMismo={usuario.id === yo?.id}
          onCambiarRol={() => abrir(usuario)}
        />
      ));
    }
  }

  return (
    <Pantalla
      titulo="Personal"
      subtitulo="Asigna o retira los roles del personal de la biblioteca. Una persona puede tener varios."
      recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
    >
      <MenuAdministracion />

      <Text variant="titleMedium" style={estilos.tituloSeccion} accessibilityRole="header">
        Usuarios y roles
      </Text>
      <Searchbar
        placeholder="Buscar por nombre o correo"
        value={busqueda}
        onChangeText={setBusqueda}
        style={estilos.buscador}
        inputStyle={estilos.textoBuscador}
        accessibilityLabel="Buscar usuario por nombre o correo"
      />
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
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.negrita, marginTop: espacio.s },
  buscador: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  textoBuscador: { fontFamily: fuentes.regular },
  lista: { gap: espacio.s },
});
