import { Component, computed, input, output } from '@angular/core';
import { Publicacion, tituloPublicacion } from '../../services/publicaciones.service';

@Component({
  selector: 'app-historia-mascota',
  templateUrl: './historia-mascota.component.html',
  styleUrl: './historia-mascota.component.scss'
})
export class HistoriaMascotaComponent {
  readonly historia = input.required<Publicacion>();
  readonly paso = input.required<number>();
  readonly total = input.required<number>();
  readonly avanzar = output<void>();
  readonly segmentos = computed(() => Array.from({ length: this.total() }, (_, indice) => indice));
  readonly tituloPublicacion = tituloPublicacion;
}
