import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { onIdTokenChanged, User } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../configuracion/firebase';
import type { Perfil } from '../modelos/perfil.model';
import { comprimirImagen, LIMITE_FOTO_PERFIL } from '../utilidades/imagenes';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly cuenta = signal<User | null>(null);
  private readonly datos = signal<Perfil>({});
  private readonly datosAuth = signal<Perfil>({});
  private readonly respaldoLocal = signal<Perfil>({});
  private readonly idsFavoritos = signal<ReadonlySet<string>>(new Set());
  private readonly perfilListo = signal(false);
  private readonly sesionLista = signal(false);
  private readonly favoritosListos = signal(false);
  private readonly pendientes = signal<ReadonlySet<string>>(new Set());
  private detenerPerfil?: () => void;
  private detenerFavoritos?: () => void;

  readonly usuario = this.cuenta.asReadonly();
  readonly perfilCargado = this.perfilListo.asReadonly();
  readonly sesionCargada = this.sesionLista.asReadonly();
  readonly favoritosCargados = this.favoritosListos.asReadonly();
  readonly cargandoPerfil = computed(() => !this.sesionCargada()
    || (!!this.usuario() && !this.perfilCargado() && !this.errorPerfil()));
  readonly errorPerfil = signal('');
  readonly errorFavoritos = signal('');
  readonly favoritos = this.idsFavoritos.asReadonly();
  readonly favoritosPendientes = this.pendientes.asReadonly();
  readonly nombre = computed(() => this.datos().nombre || this.respaldoLocal().nombre
    || this.datosAuth().nombre || 'Usuario de AdoptPoint');
  readonly foto = computed(() => this.datos().foto || this.respaldoLocal().foto
    || this.datosAuth().foto || '');
  readonly direccion = computed(() => this.datos().direccion ?? this.respaldoLocal().direccion ?? '');
  readonly ciudad = computed(() => this.datos().ciudad);
  readonly ubicacionPermitida = computed(() => this.datos().ubicacionPermitida);
  readonly telefono = computed(() => this.datos().telefono ?? this.usuario()?.phoneNumber ?? '');

  constructor() {
    const detenerSesion = onIdTokenChanged(auth, (usuario) => {
      this.datosAuth.set({ nombre: usuario?.displayName ?? '', foto: usuario?.photoURL ?? '' });
      if (usuario?.uid !== this.usuario()?.uid) {
        this.conectar(usuario);
      }
      this.sesionLista.set(true);
    });
    inject(DestroyRef).onDestroy(() => {
      detenerSesion();
      this.detenerPerfil?.();
      this.detenerFavoritos?.();
    });
  }

  async guardarPerfil(cambios: Perfil, uid = this.usuario()?.uid): Promise<void> {
    if (!uid || this.usuario()?.uid !== uid) {
      throw new Error('Inicia sesión para guardar tu perfil.');
    }
    await setDoc(doc(db, 'usuarios', uid), cambios, { merge: true });
  }

  async alternarFavorito(id: string): Promise<void> {
    const uid = this.usuario()?.uid;
    if (!uid) {
      throw new Error('Inicia sesión para guardar mascotas.');
    }
    if (this.pendientes().has(id)) {
      return;
    }

    this.pendientes.update((ids) => new Set(ids).add(id));
    const referencia = doc(db, 'usuarios', uid, 'favoritos', id);
    try {
      if (this.favoritos().has(id)) {
        await deleteDoc(referencia);
      } else {
        await setDoc(referencia, { guardadaEn: serverTimestamp() });
      }
    } finally {
      if (this.usuario()?.uid === uid) {
        this.pendientes.update((ids) => new Set([...ids].filter((pendiente) => pendiente !== id)));
      }
    }
  }

  private conectar(usuario: User | null): void {
    this.detenerPerfil?.();
    this.detenerFavoritos?.();
    this.cuenta.set(usuario);
    this.datos.set({});
    this.respaldoLocal.set({});
    this.idsFavoritos.set(new Set());
    this.pendientes.set(new Set());
    this.perfilListo.set(false);
    this.favoritosListos.set(false);
    this.errorPerfil.set('');
    this.errorFavoritos.set('');
    if (!usuario) {
      return;
    }

    const clave = 'adoptpoint:perfil:' + usuario.uid;
    const anterior = this.leerPerfilLocal(clave, usuario);
    this.respaldoLocal.set(anterior);
    const referencia = doc(db, 'usuarios', usuario.uid);
    let migracionIniciada = false;
    const esperaPerfil = window.setTimeout(() => {
      this.errorPerfil.set('La conexión está tardando en cargar tu perfil.');
    }, 12000);
    const detenerPerfil = onSnapshot(referencia, { includeMetadataChanges: true }, (documento) => {
      this.datos.set(documento.data() ?? {});
      if (!documento.metadata.fromCache || documento.exists()) {
        window.clearTimeout(esperaPerfil);
        if (!this.perfilListo()) {
          this.errorPerfil.set('');
          this.perfilListo.set(true);
        }
      }

      if (!migracionIniciada && !documento.metadata.fromCache && !documento.metadata.hasPendingWrites
        && Object.keys(anterior).length > 0) {
        migracionIniciada = true;
        void this.migrarPerfil(clave, usuario.uid, anterior).catch(() => {
          if (this.usuario()?.uid === usuario.uid) {
            this.errorPerfil.set('Los datos anteriores siguen disponibles en este dispositivo. Intenta sincronizarlos al iniciar sesión de nuevo.');
          }
        });
      }
    }, () => {
      window.clearTimeout(esperaPerfil);
      this.errorPerfil.set('No se pudo sincronizar tu perfil.');
    });

    this.detenerPerfil = () => {
      window.clearTimeout(esperaPerfil);
      detenerPerfil();
    };

    const esperaFavoritos = window.setTimeout(() => {
      this.errorFavoritos.set('La conexión está tardando en cargar tus favoritos.');
    }, 12000);
    const detenerFavoritos = onSnapshot(collection(referencia, 'favoritos'), { includeMetadataChanges: true }, (resultado) => {
      if (resultado.metadata.fromCache && resultado.empty && !this.favoritosCargados()) {
        return;
      }
      window.clearTimeout(esperaFavoritos);
      this.errorFavoritos.set('');
      this.idsFavoritos.set(new Set(resultado.docs.map((documento) => documento.id)));
      this.favoritosListos.set(true);
    }, () => {
      window.clearTimeout(esperaFavoritos);
      this.errorFavoritos.set('No se pudieron sincronizar tus favoritos.');
    });
    this.detenerFavoritos = () => {
      window.clearTimeout(esperaFavoritos);
      detenerFavoritos();
    };
  }

  private leerPerfilLocal(clave: string, usuario: User): Perfil {
    const perfil: Perfil = {};
    try {
      const datos = JSON.parse(localStorage.getItem(clave) ?? '{}') as Perfil | null;
      if (typeof datos?.foto === 'string' && datos.foto) {
        perfil.foto = datos.foto;
      }
      if (typeof datos?.direccion === 'string' && datos.direccion) {
        perfil.direccion = datos.direccion.slice(0, 160);
      }
      const nombre = usuario.email
        ? localStorage.getItem('adoptpoint:nombre:' + usuario.email.trim().toLowerCase()) : null;
      if (nombre?.trim() && !usuario.displayName) {
        perfil.nombre = nombre.trim().slice(0, 60);
      }
    } catch {
      return perfil;
    }
    return perfil;
  }

  private async migrarPerfil(clave: string, uid: string, anterior: Perfil): Promise<void> {
    const referencia = doc(db, 'usuarios', uid);
    const foto = anterior.foto && anterior.foto.length > LIMITE_FOTO_PERFIL
      ? await comprimirImagen(anterior.foto, 512, LIMITE_FOTO_PERFIL) : anterior.foto;
    if (this.usuario()?.uid !== uid) {
      return;
    }

    await runTransaction(db, async (transaccion) => {
      const actual = (await transaccion.get(referencia)).data() as Perfil | undefined;
      const cambios: Perfil = {};
      if (foto && actual?.foto === undefined) {
        cambios.foto = foto;
      }
      if (anterior.direccion && actual?.direccion === undefined) {
        cambios.direccion = anterior.direccion;
      }
      if (anterior.nombre && actual?.nombre === undefined) {
        cambios.nombre = anterior.nombre;
      }
      if (Object.keys(cambios).length > 0) {
        transaccion.set(referencia, cambios, { merge: true });
      }
    });
    if (this.usuario()?.uid === uid) {
      localStorage.removeItem(clave);
    }
  }
}
