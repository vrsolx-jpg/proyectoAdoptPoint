import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './nucleo/servicios/auth.service';
import { EsqueletoComponent } from './compartido/componentes/esqueleto/esqueleto.component';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, EsqueletoComponent],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly cargando = signal(true);
  readonly mostrandoEsqueleto = signal(false);
  readonly vistaEsqueleto = signal<'inicio' | 'perfil' | 'ajustes' | 'lista'>('inicio');
  private temporizadorEsqueleto?: number;
  private readonly inicioCarga = Date.now();
  private temporizadorLogo?: number;
  private detenerObservador: (() => void) | undefined;
  private sesionInicializada = false;
  private temporizadorCarga: number | undefined;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ubicacion = inject(Location);

  async ngOnInit(): Promise<void> {
    this.temporizadorCarga = window.setTimeout(() => {
      this.finalizarCarga();
    }, 4000);

    try {
      await this.authService.prepararSesion();
      this.detenerObservador = this.authService.observarSesion(async (usuario) => {
        const primeraEmision = !this.sesionInicializada;
        this.sesionInicializada = true;
        try {
          const url = primeraEmision ? this.ubicacion.path() || this.router.url : this.router.url;
          const debeAbrirInicio = this.esRutaDeAutenticacion(url)
            || (primeraEmision && ['/', '/tabs/tab1'].includes(url));

          if (usuario && debeAbrirInicio) {
            await this.router.navigate(['/paginaprincipal']);
          }
        } catch (error) {
          console.error('No se pudo abrir la página principal.', error);
        } finally {
          if (primeraEmision) {
            this.finalizarCarga();
          }
        }
      });
      void this.authService.completarGoogleRedireccion();
    } catch (error) {
      console.error('No se pudo restaurar la sesión guardada.', error);
      this.finalizarCarga();
    }
  }

  ngOnDestroy(): void {
    this.detenerObservador?.();
    window.clearTimeout(this.temporizadorLogo);
    window.clearTimeout(this.temporizadorEsqueleto);
    if (this.temporizadorCarga !== undefined) {
      window.clearTimeout(this.temporizadorCarga);
    }
  }

  private finalizarCarga(): void {
    if (this.temporizadorCarga !== undefined) {
      window.clearTimeout(this.temporizadorCarga);
      this.temporizadorCarga = undefined;
    }
    if (this.temporizadorLogo === undefined && this.cargando()) {
      const restante = Math.max(0, 1800 - (Date.now() - this.inicioCarga));
      this.temporizadorLogo = window.setTimeout(() => {
        const ruta = (this.ubicacion.path() || this.router.url).split('?')[0];
        const vistas = { '/paginaprincipal': 'inicio', '/perfil': 'perfil', '/ajustes': 'ajustes', '/notificaciones': 'lista' } as const;
        const vista = vistas[ruta as keyof typeof vistas];
        if (vista) {
          this.vistaEsqueleto.set(vista);
          this.mostrandoEsqueleto.set(true);
          this.temporizadorEsqueleto = window.setTimeout(() => {
            this.mostrandoEsqueleto.set(false);
            this.temporizadorEsqueleto = undefined;
          }, 300);
        }
        this.cargando.set(false);
        this.temporizadorLogo = undefined;
      }, restante);
    }
  }

  private esRutaDeAutenticacion(url: string): boolean {
    const ruta = url.split('?')[0].split('#')[0];
    return ['/acceso', '/login', '/registro', '/tabs/acceso'].includes(ruta);
  }
}
