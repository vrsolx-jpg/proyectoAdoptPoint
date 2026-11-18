import { Component, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FILTROS_VACIOS, FiltrosMascotas } from '../../../nucleo/modelos/filtros-mascotas.model';

@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.component.html',
  styleUrl: './filtros.component.scss',
  imports: [FormsModule]
})
export class FiltrosComponent {
  readonly filtrosAplicados = output<FiltrosMascotas>();
  readonly inicial = input(FILTROS_VACIOS);
  readonly criterios = linkedSignal(() => ({ ...this.inicial() }));

  aplicar(): void {
    const { edad, ubicacion } = this.criterios();
    this.filtrosAplicados.emit({ edad, ubicacion: ubicacion.trim() });
  }

  limpiar(): void {
    this.criterios.set({ ...FILTROS_VACIOS });
    this.filtrosAplicados.emit({ ...FILTROS_VACIOS });
  }
}
