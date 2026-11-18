import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, runTransaction, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UsuariosService } from './usuarios.service';
import { creditosCatalogo } from './creditos-catalogo';
import { comprimirImagen, LIMITE_FOTO_PUBLICACION } from './imagenes';


export type CasoPublicacion = 'hogar' | 'encontrado';
export type RangoEdad = 'cachorro' | 'adulto' | 'mayor';

export interface DatosPublicacion {
  especie: string;
  descripcion: string;
  nombre?: string;
  sinNombre?: boolean;
  raza?: string;
  edad?: number | RangoEdad;
  tamanio?: string;
  esterilizado?: boolean | null;
  sexo?: string;
  vacunado?: boolean | null;
  desparasitado?: boolean | null;
  peso?: number | null;
  color?: string;
  ciudad?: string;
  telefono?: string;
  compatibleNinos?: boolean | null;
  compatibleMascotas?: boolean | null;
  entrenadoCasa?: boolean | null;
  veterinario?: string;
  ultimaVisita?: string;
  proximaCita?: string;
  lugarEncontrado?: string;
  fechaEncontrado?: string;
}

export interface Publicacion {
  id: string;
  usuarioId: string;
  caso: CasoPublicacion;
  creadaEn: string;
  fotos: string[];
  publicador?: string;
  estado?: 'activa' | 'adoptada';
  demostracion?: boolean;
  creditoFoto?: { autor: string; licencia: string; enlaceLicencia?: string; fuente: string };
  datos: DatosPublicacion;
}

export function tituloPublicacion(publicacion: Publicacion): string {
  return publicacion.datos.nombre?.trim() || (publicacion.caso === 'encontrado'
    ? publicacion.datos.especie + ' encontrado' : publicacion.datos.especie + ' sin nombre');
}

export function estadoPublicacion(publicacion: Publicacion): string {
  if (publicacion.estado === 'adoptada') {
    return 'Adoptada';
  }
  return publicacion.caso === 'hogar' ? 'Busca un nuevo hogar' : publicacion.datos.especie + ' encontrado';
}

export function nombrePublicador(publicacion: Publicacion): string {
  const nombre = publicacion.publicador?.trim();
  return nombre && nombre !== 'Usuario de AdoptPoint' ? nombre : 'Nombre sin indicar';
}

export function limpiarCelular(telefono: string): string {
  return telefono.replace(/\D/g, '');
}

export function esCelularColombiano(numero: string): boolean {
  return /^3\d{9}$/.test(numero);
}

export function numeroWhatsApp(telefono: string | undefined): string | null {
  const limpio = typeof telefono === 'string' ? limpiarCelular(telefono) : '';
  if (esCelularColombiano(limpio)) {
    return '57' + limpio;
  }
  return /^573\d{9}$/.test(limpio) ? limpio : null;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly usuarios = inject(UsuariosService);
  private readonly coleccion = collection(db, 'publicaciones');
  private readonly registros = signal<Publicacion[]>([]);
  readonly publicaciones = this.registros.asReadonly();
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorMigracion = signal('');
  readonly disponibles = computed(() =>
    this.publicaciones().filter((publicacion) => publicacion.estado !== 'adoptada'));

  constructor() {
    const esperaInicial = window.setTimeout(() => {
      this.error.set('La conexión está tardando. Volveremos a mostrar las publicaciones al recuperarla.');
      this.cargando.set(false);
    }, 12000);
    const detener = onSnapshot(this.coleccion, { includeMetadataChanges: true }, (resultado) => {
      if (resultado.metadata.fromCache && resultado.empty) {
        return;
      }
      window.clearTimeout(esperaInicial);
      this.error.set('');
      const lista = resultado.docs.map((documento) => ({
        ...(documento.data() as Omit<Publicacion, 'id'>),
        id: documento.id,
        creditoFoto: creditosCatalogo[documento.id.replace(/^catalogo-/, '') as keyof typeof creditosCatalogo]
      })).filter((publicacion) => esPublicacion(publicacion) && !publicacion.demostracion);

      this.registros.set(lista.sort((a, b) => b.creadaEn.localeCompare(a.creadaEn)));
      this.cargando.set(false);
    }, () => {
      window.clearTimeout(esperaInicial);
      this.error.set('No se pudieron cargar las publicaciones.');
      this.cargando.set(false);
    });

    const detenerSesion = onAuthStateChanged(auth, (usuario) => {
      this.errorMigracion.set('');
      if (usuario) {
        const nombre = usuario.displayName || 'Usuario de AdoptPoint';
        void this.migrarPublicaciones(usuario.uid, nombre).catch(() => {
          if (auth.currentUser?.uid === usuario.uid) {
            this.errorMigracion.set('Quedaron publicaciones anteriores en este dispositivo. Se volverán a intentar sincronizar al iniciar sesión.');
          }
        });
      }
    });
    inject(DestroyRef).onDestroy(() => {
      window.clearTimeout(esperaInicial);
      detener();
      detenerSesion();

    });
  }

  telefonoDe(publicacion: Publicacion): string | null {
    const otras = this.publicaciones().filter(({ usuarioId }) => usuarioId === publicacion.usuarioId);
    const directo = numeroWhatsApp(publicacion.datos.telefono);
    const mismoUsuario = publicacion.usuarioId === this.usuarios.usuario()?.uid
      ? numeroWhatsApp(this.usuarios.telefono()) : null;
    return directo || mismoUsuario || otras.map(({ datos }) => numeroWhatsApp(datos.telefono)).find(Boolean) || null;
  }

  async crearPublicacion(caso: CasoPublicacion, datos: DatosPublicacion, fotos: string[], publicador: string): Promise<void> {
    const usuarioId = auth.currentUser?.uid;
    if (!usuarioId || !esCelularColombiano(datos.telefono ?? '') || fotos.length > 3
      || fotos.some((foto) => foto.length > LIMITE_FOTO_PUBLICACION)) {
      throw new Error('La publicación tiene datos o fotos inválidos.');
    }

    await addDoc(this.coleccion, {
      usuarioId, caso, datos, fotos, publicador: publicador.slice(0, 60),
      estado: 'activa', creadaEn: new Date().toISOString()
    });
  }

  async actualizarPublicacion(
    id: string,
    cambios: Partial<Pick<Publicacion, 'caso' | 'estado'>> & { datos?: Partial<DatosPublicacion> }
  ): Promise<void> {
    const referencia = this.referenciaPropia(id);
    const { datos, ...generales } = cambios;
    const campos = Object.fromEntries(Object.entries(datos ?? {}).map(([campo, valor]) => ['datos.' + campo, valor]));
    await updateDoc(referencia, { ...generales, ...campos });
  }

  async eliminarPublicacion(id: string): Promise<void> {
    await deleteDoc(this.referenciaPropia(id));
  }

  private referenciaPropia(id: string) {
    const uid = auth.currentUser?.uid;
    if (!uid || !this.publicaciones().some((publicacion) => publicacion.id === id && publicacion.usuarioId === uid)) {
      throw new Error('Solo puedes administrar tus publicaciones.');
    }
    return doc(this.coleccion, id);
  }

  private async migrarPublicaciones(uid: string, nombre: string): Promise<void> {
    const claves = ['adoptpoint:publicaciones:feed', 'adoptpoint:publicaciones:' + uid];
    const migradas = new Set<string>();
    const pendientes = new Map<string, Publicacion>();
    for (const clave of claves) {
      for (const publicacion of leerListaLocal(clave)) {
        if (esPublicacion(publicacion) && publicacion.usuarioId === uid && !pendientes.has(publicacion.id)) {
          pendientes.set(publicacion.id, publicacion);
        }
      }
    }

    let huboError = false;
    for (const [id, publicacion] of pendientes) {
      if (auth.currentUser?.uid !== uid) {
        return;
      }
      try {
        const referencia = doc(this.coleccion, 'local_' + uid + '_' + encodeURIComponent(id));
        const fotos = await Promise.all(publicacion.fotos.slice(0, 3).map((foto) =>
          foto.length > LIMITE_FOTO_PUBLICACION ? comprimirImagen(foto) : foto));
        const { datos, caso, creadaEn } = publicacion;
        await runTransaction(db, async (transaccion) => {
          if (!(await transaccion.get(referencia)).exists()) {
            transaccion.set(referencia, {
              usuarioId: uid, datos, caso, creadaEn, fotos, publicador: nombre.slice(0, 60), estado: 'activa'
            });
          }
        });
        migradas.add(id);
      } catch {
        huboError = true;
      }
    }

    if (migradas.size && auth.currentUser?.uid === uid) {
      for (const clave of claves) {
        const anteriores = leerListaLocal(clave);
        const restantes = anteriores.filter((publicacion) => !esPublicacion(publicacion)
          || publicacion.usuarioId !== uid || !migradas.has(publicacion.id));
        if (anteriores.length !== restantes.length) {
          localStorage.setItem(clave, JSON.stringify(restantes));
        }
      }
    }

    if (huboError) {
      throw new Error('Algunas publicaciones anteriores no se pudieron sincronizar.');
    }
  }
}

export function leerListaLocal(clave: string): unknown[] {
  const datos: unknown = JSON.parse(localStorage.getItem(clave) ?? '[]');
  if (!Array.isArray(datos)) {
    throw new Error('El historial local no es una lista.');
  }
  return datos;
}

function esPublicacion(valor: unknown): valor is Publicacion {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const publicacion = valor as Partial<Publicacion>;
  return typeof publicacion.id === 'string' && typeof publicacion.usuarioId === 'string'
    && (publicacion.caso === 'hogar' || publicacion.caso === 'encontrado')
    && typeof publicacion.creadaEn === 'string' && Array.isArray(publicacion.fotos)
    && publicacion.fotos.every((foto) => typeof foto === 'string')
    && typeof publicacion.datos?.especie === 'string' && typeof publicacion.datos.descripcion === 'string';
}
