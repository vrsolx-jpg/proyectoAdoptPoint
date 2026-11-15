import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  heartOutline,
  imageOutline,
  notificationsOutline,
  optionsOutline,
  pawOutline,
  searchOutline,
  homeOutline,
  personOutline
} from 'ionicons/icons';

type Vista = 'historias' | 'dashboard';

interface Historia {
  nombre: string;
  tipo: string;
  imagen: string;
  alt: string;
}

interface Categoria {
  nombre: string;
  icono: string;
  seleccionada: boolean;
}

@Component({
  selector: 'app-paginaprincipal',
  templateUrl: './paginaprincipal.page.html',
  styleUrls: ['./paginaprincipal.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, RouterLink]
})
export class PaginaPrincipalPage {
  vista: Vista = 'historias';
  historiaActual = 0;

  readonly historias: Historia[] = [
    { nombre: 'Coco', tipo: 'Perro', imagen: 'assets/img/perro.jpg', alt: 'Perro disponible para adopción' },
    { nombre: 'Fili', tipo: 'Gato', imagen: 'assets/img/fili.jpg', alt: 'Gato disponible para adopción' }
  ];

  readonly categorias: Categoria[] = [
    { nombre: 'Todos', icono: 'paw-outline', seleccionada: true },
    { nombre: 'Perros', icono: 'paw-outline', seleccionada: false },
    { nombre: 'Gatos', icono: 'paw-outline', seleccionada: false },
    { nombre: 'Aves', icono: 'paw-outline', seleccionada: false },
    { nombre: 'Otros', icono: 'paw-outline', seleccionada: false }
  ];

  constructor() {
    addIcons({
      heartOutline,
      imageOutline,
      notificationsOutline,
      optionsOutline,
      pawOutline,
      searchOutline,
      homeOutline,
      personOutline
    });
  }

  siguienteHistoria(): void {
    if (this.historiaActual < this.historias.length - 1) {
      this.historiaActual += 1;
      return;
    }
    this.vista = 'dashboard';
  }

  seleccionarCategoria(nombre: string): void {
    for (const categoria of this.categorias) {
      categoria.seleccionada = categoria.nombre === nombre;
    }
  }
}