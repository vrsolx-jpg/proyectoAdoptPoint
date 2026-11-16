import { Component } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  heartOutline,
  locationOutline,
  personCircleOutline
} from 'ionicons/icons';

interface Mascota {
  nombre: string;
  especie: string;
  edad: string;
  descripcion: string;
  imagen: string;
  alt: string;
  publicador: string;
  ubicacion: string;
  contacto: string;
}

@Component({
  selector: 'app-tarjetas-mascotas',
  templateUrl: './tarjetas-mascotas.component.html',
  styleUrls: ['./tarjetas-mascotas.component.scss'],
  standalone: true,
  imports: [IonIcon],
})
export class TarjetasMascotasComponent {
  readonly mascotas: Mascota[] = [
    {
      nombre: 'Coco',
      especie: 'Perro',
      edad: '2 años',
      descripcion: 'Compañero cariñoso en busca de un hogar lleno de amor.',
      imagen: 'assets/img/perro.jpg',
      alt: 'Coco, perro disponible para adopción',
      publicador: 'Refugio AdoptPoint',
      ubicacion: 'Bogotá, Colombia',
      contacto: 'Contacto disponible próximamente'
    },
    {
      nombre: 'Fili',
      especie: 'Gato',
      edad: '1 año',
      descripcion: 'Tranquilo y juguetón, ideal para una familia cariñosa.',
      imagen: 'assets/img/fili.jpg',
      alt: 'Fili, gato disponible para adopción',
      publicador: 'Fundación Huellitas',
      ubicacion: 'Bogotá, Colombia',
      contacto: 'Contacto disponible próximamente'
    }
  ];

  mascotaSeleccionada: Mascota | null = null;
  favoritos = new Set<string>();

  constructor() {
    addIcons({
      closeOutline,
      heartOutline,
      locationOutline,
      personCircleOutline
    });
  }

  abrirDetalle(mascota: Mascota): void {
    this.mascotaSeleccionada = mascota;
  }

  cerrarDetalle(): void {
    this.mascotaSeleccionada = null;
  }

  alternarFavorito(mascota: Mascota, event: Event): void {
    event.stopPropagation();
    if (this.favoritos.has(mascota.nombre)) {
      this.favoritos.delete(mascota.nombre);
    } else {
      this.favoritos.add(mascota.nombre);
    }
  }

  esFavorita(mascota: Mascota): boolean {
    return this.favoritos.has(mascota.nombre);
  }

}
