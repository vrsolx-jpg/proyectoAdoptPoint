import { Component, input } from '@angular/core';

type Vista = 'inicio' | 'catalogo' | 'historia' | 'perfil' | 'ajustes' | 'lista';

@Component({
  selector: 'app-esqueleto',
  templateUrl: './esqueleto.component.html',
  styleUrl: './esqueleto.component.scss'
})
export class EsqueletoComponent {
  readonly vista = input<Vista>('catalogo');
  readonly etiqueta = input('Cargando contenido');
  readonly bloques = [0, 1, 2, 3];
}
