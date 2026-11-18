import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { pawOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  imports: [IonContent, IonIcon],
})
export class Tab1Page {
  private puntoInicial = 0;
  private deslizando = false;

  private readonly router = inject(Router);
  constructor() {
    addIcons({ pawOutline });
  }

  iniciarDeslizamiento(event: PointerEvent): void {
    this.puntoInicial = event.clientX;
    this.deslizando = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  moverDeslizador(event: PointerEvent): void {
    if (!this.deslizando) {
      return;
    }

    const deslizador = event.currentTarget as HTMLElement;
    const recorrido = deslizador.clientWidth - 54;
    const desplazamiento = Math.max(0, Math.min(event.clientX - this.puntoInicial, recorrido));
    deslizador.style.setProperty('--desplazamiento', `${desplazamiento}px`);
  }

  finalizarDeslizamiento(event: PointerEvent): void {
    if (!this.deslizando) {
      return;
    }

    const deslizador = event.currentTarget as HTMLElement;
    const recorrido = deslizador.clientWidth - 54;
    const desplazamiento = event.clientX - this.puntoInicial;
    this.deslizando = false;
    deslizador.releasePointerCapture(event.pointerId);

    if (desplazamiento >= recorrido * 0.6) {
      this.router.navigate(['/acceso']);
      return;
    }

    deslizador.style.setProperty('--desplazamiento', '0px');
  }

  cancelarDeslizamiento(): void {
    this.deslizando = false;
  }

  activarAcceso(): void {
    if (!this.deslizando) {
      this.router.navigate(['/acceso']);
    }
  }
}