import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { App } from '@capacitor/app';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logoWhatsapp, notificationsOutline } from 'ionicons/icons';
import { Notificacion } from '../../nucleo/modelos/notificacion.model';
import { NotificacionesService } from '../../nucleo/servicios/notificaciones.service';
import { EsqueletoComponent } from '../../compartido/componentes/esqueleto/esqueleto.component';
import { UsuariosService } from '../../nucleo/servicios/usuarios.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrl: './notificaciones.page.scss',
  imports: [DatePipe, IonContent, IonIcon, RouterLink, EsqueletoComponent]
})
export class NotificacionesPage {
  readonly notificacionesRecibidas = signal<Notificacion[]>([]);
  readonly notificacionesEnviadas = signal<Notificacion[]>([]);
  readonly pestana = signal<'recibidas' | 'enviadas'>('recibidas');
  readonly error = signal('');
  readonly errorLectura = signal('');
  readonly marcandoLectura = signal(false);
  private readonly bandejaVisible = signal(false);
  private readonly documentoVisible = signal(document.visibilityState !== 'hidden');
  private readonly aplicacionActiva = signal(true);
  private ultimaLecturaIntentada = '';
  private versionLectura = 0;
  readonly recibidasListas = signal(false);
  readonly enviadasListas = signal(false);
  readonly cargando = computed(() => !this.usuarios.sesionCargada()
    || (!!this.usuarios.usuario() && !(this.pestana() === 'recibidas' ? this.recibidasListas() : this.enviadasListas())));
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);

  constructor() {
    addIcons({ arrowBackOutline, logoWhatsapp, notificationsOutline });
    const actualizarVisibilidad = () => this.documentoVisible.set(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', actualizarVisibilidad);
    const estadoNativo = Capacitor.isNativePlatform()
      ? App.addListener('appStateChange', ({ isActive }) => this.aplicacionActiva.set(isActive))
      : Promise.resolve(undefined);
    void estadoNativo.catch(() => undefined);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', actualizarVisibilidad);
      void estadoNativo.then((suscripcion) => suscripcion?.remove()).catch(() => undefined);
    });
    effect((limpiar) => {
      const uid = this.usuarios.usuario()?.uid;
      this.notificacionesRecibidas.set([]);
      this.notificacionesEnviadas.set([]);
      this.error.set('');
      this.errorLectura.set('');
      this.marcandoLectura.set(false);
      this.ultimaLecturaIntentada = '';
      this.versionLectura++;
      this.recibidasListas.set(false);
      this.enviadasListas.set(false);
      if (uid) {
        const alFallar = () => this.error.set('No se pudieron sincronizar tus notificaciones.');
        const espera = window.setTimeout(alFallar, 12000);
        const detenerRecibidas = this.notificaciones.observar(uid, 'recibidas', (lista) => {
          this.notificacionesRecibidas.set(lista);
          this.recibidasListas.set(true);
          if (untracked(this.enviadasListas)) {
            window.clearTimeout(espera);
            this.error.set('');
          }
        }, alFallar);
        const detenerEnviadas = this.notificaciones.observar(uid, 'enviadas', (lista) => {
          this.notificacionesEnviadas.set(lista);
          this.enviadasListas.set(true);
          if (untracked(this.recibidasListas)) {
            window.clearTimeout(espera);
            this.error.set('');
          }
        }, alFallar);
        limpiar(() => {
          window.clearTimeout(espera);
          detenerRecibidas();
          detenerEnviadas();
        });
      }
    });
    effect(() => {
      const uid = this.usuarios.usuario()?.uid;
      if (!uid || !this.bandejaVisible() || !this.documentoVisible() || !this.aplicacionActiva() || this.pestana() !== 'recibidas'
        || !this.recibidasListas() || this.error() || this.marcandoLectura()) {
        return;
      }
      const pendientes = this.notificacionesRecibidas().filter((notificacion) =>
        !this.notificaciones.estaLeida(notificacion, uid));
      if (!pendientes.length) {
        return;
      }
      const clave = uid + ':' + pendientes.map(({ id }) => id).sort().join('|');
      if (this.ultimaLecturaIntentada === clave) {
        return;
      }
      this.ultimaLecturaIntentada = clave;
      void this.guardarLectura(pendientes, uid);
    });
  }

  ionViewWillEnter(): void {
    this.pestana.set('recibidas');
    this.ultimaLecturaIntentada = '';
  }

  ionViewDidEnter(): void {
    this.bandejaVisible.set(true);
  }

  ionViewWillLeave(): void {
    this.bandejaVisible.set(false);
  }

  reintentarLectura(): void {
    this.ultimaLecturaIntentada = '';
    const uid = this.usuarios.usuario()?.uid;
    if (uid && !this.marcandoLectura()) {
      const pendientes = this.notificacionesRecibidas().filter((notificacion) =>
        !this.notificaciones.estaLeida(notificacion, uid));
      this.ultimaLecturaIntentada = uid + ':' + pendientes.map(({ id }) => id).sort().join('|');
      void this.guardarLectura(pendientes, uid);
    }
  }

  private async guardarLectura(lista: Notificacion[], uid: string): Promise<void> {
    const version = ++this.versionLectura;
    this.marcandoLectura.set(true);
    this.errorLectura.set('');
    try {
      await this.notificaciones.marcarLeidas(lista, uid);
    } catch {
      if (this.versionLectura === version && this.usuarios.usuario()?.uid === uid) {
        this.errorLectura.set('No pudimos guardar la lectura de tus notificaciones.');
      }
    } finally {
      if (this.versionLectura === version && this.usuarios.usuario()?.uid === uid) {
        this.marcandoLectura.set(false);
      }
    }
  }

  readonly enlaceWhatsApp = (notificacion: Notificacion) => this.notificaciones.enlaceWhatsApp(notificacion);

  async abrirWhatsApp(evento: Event, enlace: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    evento.preventDefault();
    try {
      if (!(await AppLauncher.openUrl({ url: enlace })).completed) {
        this.error.set('No pudimos abrir WhatsApp en este dispositivo.');
      }
    } catch {
      this.error.set('No pudimos abrir WhatsApp en este dispositivo.');
    }
  }

  seleccionarPestana(pestana: 'recibidas' | 'enviadas'): void {
    this.pestana.set(pestana);
  }
}
