import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  readonly cargando = signal(true);
  private readonly inicioCarga = Date.now();
  private detenerObservador: (() => void) | undefined;
  private sesionInicializada = false;
  private temporizadorCarga: number | undefined;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

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
          const debeAbrirInicio = primeraEmision
            ? !this.router.url.includes('/paginaprincipal')
            : this.esRutaDeAutenticacion(this.router.url);

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
    } catch (error) {
      console.error('No se pudo restaurar la sesión guardada.', error);
      this.finalizarCarga();
    }
  }

  ngOnDestroy(): void {
    this.detenerObservador?.();
    if (this.temporizadorCarga !== undefined) {
      window.clearTimeout(this.temporizadorCarga);
    }
  }

  private finalizarCarga(): void {
    if (!this.cargando()) {
      return;
    }

    const tiempoRestante = Math.max(0, 2500 - (Date.now() - this.inicioCarga));
    this.temporizadorCarga = window.setTimeout(() => {
      this.cargando.set(false);
      this.temporizadorCarga = undefined;
    }, tiempoRestante);
  }

  private esRutaDeAutenticacion(url: string): boolean {
    const ruta = url.split('?')[0].split('#')[0];
    return ['/acceso', '/login', '/registro', '/tabs/acceso'].includes(ruta);
  }
}
