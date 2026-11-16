import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { FiltrosComponent } from './filtros.component';

describe('FiltrosComponent', () => {
  let component: FiltrosComponent;

  beforeEach(() => {
    component = new FiltrosComponent();
  });

  it('crea el componente de filtros', () => {
    expect(component).toBeTruthy();
  });

  it('emite los filtros seleccionados y recorta la ubicación', () => {
    let emitidos = '';
    component.criterios = {
      edad: 'adulto',
      tamanio: 'Mediano',
      especie: 'Gato',
      ubicacion: '  Bogotá  ',
      sexo: 'Hembra'
    };
    component.filtrosAplicados.subscribe((filtros) => {
      emitidos = JSON.stringify(filtros);
    });

    component.aplicar();

    expect(JSON.parse(emitidos)).toEqual({
      edad: 'adulto',
      tamanio: 'Mediano',
      especie: 'Gato',
      ubicacion: 'Bogotá',
      sexo: 'Hembra'
    });
  });

  it('restablece y emite criterios vacíos al limpiar', () => {
    component.criterios.edad = 'mayor';
    let emitidos = '';
    component.filtrosAplicados.subscribe((filtros) => {
      emitidos = JSON.stringify(filtros);
    });

    component.limpiar();

    expect(JSON.parse(emitidos)).toEqual({
      edad: '',
      tamanio: '',
      especie: '',
      ubicacion: '',
      sexo: ''
    });
  });
});
