import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, pawOutline } from 'ionicons/icons';

@Component({
  selector: 'app-terminos',
  imports: [IonContent, IonIcon, RouterLink],
  templateUrl: './terminos.page.html',
  styleUrl: './terminos.page.scss'
})
export class TerminosPage {
  constructor() {
    addIcons({ arrowBackOutline, pawOutline });
  }
}
