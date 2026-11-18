import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { creditosCatalogo } from '../../nucleo/datos/creditos-catalogo';

interface CreditoImagen {
  mascota: string;
  foto: string;
  autor: string;
  licencia: string;
  fuente: string;
  enlaceLicencia?: string;
}

@Component({
  selector: 'app-creditos',
  imports: [RouterLink, IonContent, IonIcon],
  templateUrl: './creditos.page.html',
  styleUrl: './creditos.page.scss'
})
export class CreditosPage {
  readonly fotografias: CreditoImagen[] = Object.entries(creditosCatalogo).map(([id, credito]) => ({
    mascota: id.charAt(0).toUpperCase() + id.slice(1),
    foto: 'assets/img/catalogo/' + id + '.jpg',
    ...credito
  }));

  constructor() {
    addIcons({ arrowBackOutline });
  }
}
