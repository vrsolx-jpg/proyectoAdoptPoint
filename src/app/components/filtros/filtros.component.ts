import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type EdadFiltro = 'cachorro' | 'adulto' | 'mayor';
export type TamanioFiltro = 'Pequeño' | 'Mediano' | 'Grande';
export type EspecieFiltro = 'Perro' | 'Gato' | 'Ave' | 'Otro';
export type SexoFiltro = 'Macho' | 'Hembra';

export interface FiltrosMascotas {
  edad: EdadFiltro | '';
  tamanio: TamanioFiltro | '';
  especie: EspecieFiltro | '';
  ubicacion: string;
  sexo: SexoFiltro | '';
}

@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.component.html',
  styleUrls: ['./filtros.component.scss'],
  imports: [FormsModule]
})
export class FiltrosComponent {
  @Output() readonly filtrosAplicados = new EventEmitter<FiltrosMascotas>();

  readonly rangosEdad: { valor: EdadFiltro; etiqueta: string }[] = [
    { valor: 'cachorro', etiqueta: 'Cachorro · 0-2 años' },
    { valor: 'adulto', etiqueta: 'Adulto · 2-6 años' },
    { valor: 'mayor', etiqueta: 'Mayor · 6+ años' }
  ];
  readonly tamanos: TamanioFiltro[] = ['Pequeño', 'Mediano', 'Grande'];
  readonly especies: EspecieFiltro[] = ['Perro', 'Gato', 'Ave', 'Otro'];
  readonly sexos: SexoFiltro[] = ['Macho', 'Hembra'];

  criterios: FiltrosMascotas = this.filtrosVacios();

  aplicar(): void {
    this.filtrosAplicados.emit({
      ...this.criterios,
      ubicacion: this.criterios.ubicacion.trim()
    });
  }

  limpiar(): void {
    this.criterios = this.filtrosVacios();
    this.filtrosAplicados.emit({ ...this.criterios });
  }

  private filtrosVacios(): FiltrosMascotas {
    return {
      edad: '',
      tamanio: '',
      especie: '',
      ubicacion: '',
      sexo: ''
    };
  }
}
