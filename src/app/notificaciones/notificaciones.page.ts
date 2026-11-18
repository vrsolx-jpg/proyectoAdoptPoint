import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logoWhatsapp, notificationsOutline } from 'ionicons/icons';
import { Notificacion, NotificacionesService } from '../services/notificaciones.service';
import { EsqueletoComponent } from '../components/esqueleto/esqueleto.component';
import { UsuariosService } from '../services/usuarios.service';

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
  readonly recibidasListas = signal(false);
  readonly enviadasListas = signal(false);
  readonly cargando = computed(() => !this.usuarios.sesionCargada()
    || (!!this.usuarios.usuario() && !(this.pestana() === 'recibidas' ? this.recibidasListas() : this.enviadasListas())));
  private readonly usuarios = inject(UsuariosService);
  private readonly notificaciones = inject(NotificacionesService);

  constructor() {
    addIcons({ arrowBackOutline, logoWhatsapp, notificationsOutline });
    effect((limpiar) => {
      const uid = this.usuarios.usuario()?.uid;
      this.notificacionesRecibidas.set([]);
      this.notificacionesEnviadas.set([]);
      this.error.set('');
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
