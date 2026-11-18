import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlertController, IonContent, IonIcon, IonModal, ModalController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, closeOutline, heart, heartOutline, homeOutline, locationOutline, logoWhatsapp,
  notificationsOutline, optionsOutline, pawOutline, personCircleOutline, personOutline } from 'ionicons/icons';
import { HistoriaMascotaComponent } from '../components/historia-mascota/historia-mascota.component';
import { FiltrosComponent, FILTROS_VACIOS, FiltrosMascotas } from '../components/filtros/filtros.component';
import { TarjetasMascotasComponent } from '../components/tarjetas-mascotas/tarjetas-mascotas.component';
import { Publicacion, PublicacionesService, estadoPublicacion, nombrePublicador, numeroWhatsApp, tituloPublicacion } from '../services/publicaciones.service';
import { ConfirmarEliminacionService } from '../services/confirmar-eliminacion.service';
import { EsqueletoComponent } from '../components/esqueleto/esqueleto.component';
import { UsuariosService } from '../services/usuarios.service';
import { UbicacionService } from '../services/ubicacion.service';
import { NotificacionesService } from '../services/notificaciones.service';

export function filtrarPublicaciones(
  publicaciones: Publicacion[],
  filtros: FiltrosMascotas
): Publicacion[] {
  const buscada = normalizarUbicacion(filtros.ubicacion);
  return publicaciones.filter(({ datos }) => coincideEdad(datos.edad, filtros.edad)
    && (!buscada || [datos.ciudad, datos.lugarEncontrado].some((ubicacion) =>
      normalizarUbicacion(ubicacion ?? '').includes(buscada))));
}

function coincideEdad(
  edad: Publicacion['datos']['edad'],
  filtro: FiltrosMascotas['edad']
): boolean {
  if (!filtro) {
    return true;
  }

  if (typeof edad === 'number') {
    if (!Number.isFinite(edad) || edad < 0) {
      return false;
    }

    edad = edad < 2 ? 'cachorro' : edad < 6 ? 'adulto' : 'mayor';
  }

  return edad === filtro;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizarUbicacion(ubicacion: string): string {
  return normalizarTexto(ubicacion)
    .replace(/\bbogota(?: distrito capital| d\.?\s*c\.?)\b\.?/g, 'bogota')
    .replace(/\bsantiago de cali\b/g, 'cali');
}

@Component({
  selector: 'app-paginaprincipal',
  templateUrl: './paginaprincipal.page.html',
  styleUrl: './paginaprincipal.page.scss',
  imports: [IonContent, IonIcon, IonModal, RouterLink, FiltrosComponent, TarjetasMascotasComponent, HistoriaMascotaComponent, EsqueletoComponent]
})
export class PaginaPrincipalPage {
  readonly perfil = inject(UsuariosService);
  readonly publicacionesService = inject(PublicacionesService);
  private readonly ubicacion = inject(UbicacionService);
  private readonly avisos = inject(ToastController);
  private readonly modales = inject(ModalController);
  private navegandoASolicitudes = false;
  private readonly eliminacion = inject(ConfirmarEliminacionService);
  readonly eliminando = signal(false);
  private readonly alertas = inject(AlertController);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly parametros = toSignal(this.ruta.queryParamMap);
  private readonly idSeleccionado = linkedSignal(() => this.parametros()?.get('mascota') ?? null);
  readonly usuario = this.perfil.usuario;
  readonly filtrosAbiertos = signal(false);
  private readonly criterios = linkedSignal(() => {
    this.usuario();
    return FILTROS_VACIOS;
  });
  readonly ciudad = linkedSignal<{ uid: string | undefined; ciudad: string }, string>({
    source: () => ({ uid: this.usuario()?.uid, ciudad: this.perfil.ciudad() ?? '' }),
    computation: (actual, anterior) => anterior && anterior.source.uid === actual.uid && anterior.value !== anterior.source.ciudad
      ? anterior.value : actual.ciudad
  });
  readonly criteriosFiltro = computed(() => ({ ...this.criterios(), ubicacion: this.ciudad() }));
  readonly publicacionesFiltradas = computed(() =>
    filtrarPublicaciones(this.publicacionesService.disponibles(), this.criteriosFiltro()));
  readonly publicacionSeleccionada = computed(() => {
    const id = this.idSeleccionado();
    return this.publicacionesService.publicaciones().find((publicacion) => publicacion.id === id)
      ?? null;
  });
  readonly fotoDetalle = linkedSignal(() => {
    this.idSeleccionado();
    return 0;
  });
  readonly nombreUsuario = computed(() => this.perfil.nombre().trim().split(/\s+/)[0]);
  readonly tituloPublicacion = tituloPublicacion;
  readonly estadoPublicacion = estadoPublicacion;

  private readonly claveCatalogo = computed(() => 'adoptpoint:catalogo-v3:' + (this.usuario()?.uid ?? 'invitado'));
  readonly catalogoAbierto = linkedSignal(() => {
    try {
      return localStorage.getItem(this.claveCatalogo()) === 'true';
    } catch {
      return false;
    }
  });
  readonly historias = linkedSignal<{ uid: string | undefined; cargando: boolean; recientes: Publicacion[] }, Publicacion[]>({
    source: () => ({
      uid: this.usuario()?.uid,
      cargando: this.publicacionesService.cargando(),
      recientes: this.publicacionesService.publicaciones()
    }),
    computation: ({ uid, cargando, recientes }, previa) => {
      if (previa && previa.source.uid === uid && previa.value.length) {
        return previa.value;
      }
      return cargando ? [] : recientes
        .filter((publicacion) => publicacion.estado !== 'adoptada' && publicacion.fotos[0])
        .slice(0, 2);
    }
  });
  readonly mostrarHistoria = computed(() => !this.catalogoAbierto() && !this.parametros()?.has('mascota')
    && (this.publicacionesService.cargando() || this.historias().length > 0));
  readonly nombrePublicador = nombrePublicador;
  readonly pasoHistoria = linkedSignal(() => {
    this.claveCatalogo();
    return 0;
  });

  private readonly inicioVisible = signal(false);
  private avisoUbicacion?: HTMLIonToastElement;
  private preparandoAviso = false;
  private alertaCelular?: HTMLIonAlertElement;
  private preparandoCelular = false;
  private readonly pendienteCelular = linkedSignal(() => {
    const uid = this.usuario()?.uid;
    try {
      return !!uid && localStorage.getItem('adoptpoint:celular-pendiente:' + uid) === 'true';
    } catch {
      return false;
    }
  });
  readonly detectando = this.ubicacion.detectando;
  readonly ubicacionOmitida = linkedSignal(() => {
    this.usuario();
    return false;
  });
  readonly mensajeUbicacion = this.ubicacion.mensaje;
  readonly mensajeDetalle = signal('');
  readonly solicitando = signal(false);

  constructor() {
    addIcons({ addOutline, closeOutline, heart, heartOutline, homeOutline, locationOutline, logoWhatsapp,
      notificationsOutline, optionsOutline, pawOutline, personCircleOutline, personOutline });
    effect(() => {
      const uid = this.usuario()?.uid;
      if (!uid || !this.inicioVisible() || !this.perfil.perfilCargado()) {
        return;
      }
      if (this.pendienteCelular()) {
        if (!this.preparandoAviso) {
          void this.preguntarCelular(uid);
        }
      } else if (this.perfil.ubicacionPermitida() === undefined && !this.ubicacionOmitida()) {
        void this.preguntarUbicacion(uid);
      }
    });
  }

  ionViewDidEnter(): void {
    this.inicioVisible.set(true);
  }

  ionViewWillLeave(): void {
    this.inicioVisible.set(false);
    void this.avisoUbicacion?.dismiss();
    void this.alertaCelular?.dismiss();
  }

  avanzarHistoria(): void {
    const siguiente = this.pasoHistoria() + 1;
    if (siguiente < this.historias().length) {
      this.pasoHistoria.set(siguiente);
    } else {
      this.mostrarCatalogo();
    }
  }

  private async preguntarUbicacion(uid: string): Promise<void> {
    if (this.preparandoAviso) {
      return;
    }
    this.preparandoAviso = true;
    try {
      const aviso = await this.avisos.create({
        position: 'middle',
        layout: 'baseline',
        cssClass: ['aviso-gps', 'permiso-ubicacion'],
        header: '¿Permitir usar la ubicación en tiempo real?',
        message: 'De esta manera podremos encontrar mascotas cerca tuyo',
        buttons: [
          { text: 'No permitir', role: 'cancel' },
          { text: 'Permitir', role: 'permitir' }
        ]
      });
      if (!this.inicioVisible() || this.usuario()?.uid !== uid) {
        aviso.remove();
        return;
      }
      this.avisoUbicacion = aviso;
      await aviso.present();
      const { role } = await aviso.onDidDismiss();
      if (this.inicioVisible() && this.usuario()?.uid === uid) {
        if (role === 'permitir') {
          this.ubicacionOmitida.set(true);
          this.actualizarPendienteCelular(uid, true);
          void this.detectarCiudad();
        } else if (role === 'cancel') {
          this.ubicacionOmitida.set(true);
          await this.ubicacion.omitir();
        }
      }
    } catch {
      this.mensajeUbicacion.set('El permiso de ubicación no está disponible. Puedes elegir tu ciudad en los filtros.');
    } finally {
      this.avisoUbicacion = undefined;
      this.preparandoAviso = false;
      if (this.inicioVisible() && this.usuario()?.uid === uid && this.pendienteCelular()) {
        void this.preguntarCelular(uid);
      }
    }
  }

  private actualizarPendienteCelular(uid: string, pendiente: boolean): void {
    if (this.usuario()?.uid === uid) {
      this.pendienteCelular.set(pendiente);
    }
    const clave = 'adoptpoint:celular-pendiente:' + uid;
    try {
      if (pendiente) {
        localStorage.setItem(clave, 'true');
      } else {
        localStorage.removeItem(clave);
      }
    } catch {
      return;
    }
  }

  private async preguntarCelular(uid: string): Promise<void> {
    if (this.preparandoCelular) {
      return;
    }
    this.preparandoCelular = true;
    try {
      const existente = numeroWhatsApp(this.perfil.telefono())?.slice(2) ?? '';
      if (existente && await this.guardarCelular(uid, existente)) {
        return;
      }
      if (!this.inicioVisible() || this.usuario()?.uid !== uid) {
        return;
      }

      const alerta = await this.alertas.create({
        header: 'Agrega tu celular',
        message: 'Escribe un celular colombiano de 10 dígitos. Quedará guardado en Ajustes.',
        cssClass: 'aviso-celular',
        backdropDismiss: false,
        inputs: [{
          name: 'telefono', type: 'tel', value: existente, placeholder: '3001234567',
          attributes: { maxlength: 18, autocomplete: 'tel-national', 'aria-label': 'Celular' }
        }],
        buttons: [{
          text: 'Guardar',
          handler: async ({ telefono }) => {
            const numero = numeroWhatsApp(typeof telefono === 'string' ? telefono : undefined);
            if (!numero) {
              alerta.message = 'Escribe un celular colombiano válido de 10 dígitos que comience por 3.';
              return false;
            }
            alerta.message = 'Guardando tu celular…';
            if (!await this.guardarCelular(uid, numero.slice(2))) {
              alerta.message = 'No pudimos guardar tu celular. Inténtalo de nuevo.';
              return false;
            }
            return true;
          }
        }]
      });
      if (!this.inicioVisible() || this.usuario()?.uid !== uid) {
        alerta.remove();
        return;
      }
      this.alertaCelular = alerta;
      await alerta.present();
      await alerta.onDidDismiss();
    } catch {
      this.mensajeUbicacion.set('No pudimos abrir el formulario de celular. Puedes guardarlo en Ajustes.');
    } finally {
      this.alertaCelular = undefined;
      this.preparandoCelular = false;
    }
  }

  private async guardarCelular(uid: string, telefono: string): Promise<boolean> {
    try {
      await this.perfil.guardarPerfil({ telefono }, uid);
      this.actualizarPendienteCelular(uid, false);
      return true;
    } catch {
      return false;
    }
  }

  mostrarCatalogo(): void {
    this.catalogoAbierto.set(true);
    try {
      localStorage.setItem(this.claveCatalogo(), 'true');
    } catch {
      return;
    }
  }

  async aplicarFiltros(filtros: FiltrosMascotas): Promise<void> {
    this.mostrarCatalogo();
    this.criterios.set(filtros);
    this.filtrosAbiertos.set(false);
    this.guardarCiudad(filtros.ubicacion);
  }

  async detectarCiudad(): Promise<void> {
    try {
      const ciudad = await this.ubicacion.usarUbicacionActual();
      this.ciudad.set(ciudad);
    } catch {
      // El servicio muestra el motivo y permite volver a usar el GPS.
    }
  }

  guardarCiudad(ciudad: string): void {
    this.ciudad.set(ciudad.trim());
  }

  abrirDetalle(publicacion: Publicacion): void {
    this.mensajeDetalle.set('');
    this.idSeleccionado.set(publicacion.id);
    this.fotoDetalle.set(0);
  }

  cerrarDetalle(limpiarRuta = true): void {
    this.mensajeDetalle.set('');
    this.idSeleccionado.set(null);
    if (limpiarRuta && !this.navegandoASolicitudes && this.parametros()?.has('mascota')) {
      void this.router.navigate([], { relativeTo: this.ruta, queryParams: { mascota: null },
        queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  async verSolicitudes(evento: Event): Promise<void> {
    evento.preventDefault();
    this.navegandoASolicitudes = true;
    try {
      const modal = await this.modales.getTop();
      if (modal) {
        await modal.dismiss();
      }
      this.idSeleccionado.set(null);
      await this.router.navigate(['/notificaciones']);
    } finally {
      this.navegandoASolicitudes = false;
    }
  }

  async alternarFavorito(id: string): Promise<void> {
    try {
      await this.perfil.alternarFavorito(id);
    } catch {
      this.mensajeDetalle.set(this.usuario() ? 'No se pudo actualizar el favorito.' : 'Inicia sesión para guardar mascotas.');
    }
  }

  async contactarPorWhatsApp(publicacion: Publicacion): Promise<void> {
    if (publicacion.demostracion || publicacion.usuarioId === this.usuario()?.uid) {
      return;
    }
    const numero = this.publicacionesService.telefonoDe(publicacion);
    if (!numero) {
      this.mensajeDetalle.set('Esta publicación no tiene un celular colombiano válido.');
      return;
    }
    const mensaje = encodeURIComponent('Hola, vi en AdoptPoint la publicación de ' + tituloPublicacion(publicacion)
      + '. ¿Podrías darme más información?');
    const url = 'https://wa.me/' + numero + '?text=' + mensaje;
    this.mensajeDetalle.set('');
    if (Capacitor.isNativePlatform()) {
      try {
        if (!(await AppLauncher.openUrl({ url })).completed) {
          this.mensajeDetalle.set('No se pudo abrir WhatsApp en este dispositivo.');
        }
      } catch {
        this.mensajeDetalle.set('No se pudo abrir WhatsApp en este dispositivo.');
      }
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async eliminar(publicacion: Publicacion): Promise<void> {
    if (this.eliminando() || publicacion.usuarioId !== this.usuario()?.uid) {
      return;
    }
    this.eliminando.set(true);
    try {
      if (await this.eliminacion.preguntar()) {
        await this.publicacionesService.eliminarPublicacion(publicacion.id);
        this.cerrarDetalle();
      }
    } catch {
      this.mensajeDetalle.set('No pudimos eliminar la publicación. Inténtalo de nuevo.');
    } finally {
      this.eliminando.set(false);
    }
  }

  async solicitarAdopcion(publicacion: Publicacion): Promise<void> {
    const usuario = this.usuario();
    if (!usuario) {
      this.mensajeDetalle.set('Inicia sesión para enviar una solicitud.');
      return;
    }
    if (this.solicitando() || publicacion.demostracion || publicacion.usuarioId === usuario.uid
      || publicacion.estado === 'adoptada') {
      return;
    }

    this.solicitando.set(true);
    try {
      if (await this.notificaciones.crearSolicitudAdopcion(publicacion)) {
        this.mensajeDetalle.set('Solicitud de adopción enviada.');
      }
    } catch (error) {
      this.mensajeDetalle.set(error instanceof Error && !('code' in error) ? error.message
        : 'No se pudo enviar la solicitud. Inténtalo nuevamente.');
    } finally {
      this.solicitando.set(false);
    }
  }
}
