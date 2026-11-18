import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FiltrosComponent } from './filtros.component';

describe('FiltrosComponent', () => {
  let component: FiltrosComponent;

  beforeEach(() => {
    component = TestBed.runInInjectionContext(() => new FiltrosComponent());
  });

  it('crea el componente de filtros', () => {
    expect(component).toBeTruthy();
  });

  it('emite los filtros seleccionados y recorta la ubicación', () => {
    let emitidos = '';
    component.criterios.set({
      edad: 'adulto',
      ubicacion: '  Bogotá  ',
    });
    component.filtrosAplicados.subscribe((filtros) => {
      emitidos = JSON.stringify(filtros);
    });

    component.aplicar();

    expect(JSON.parse(emitidos)).toEqual({
      edad: 'adulto',
      ubicacion: 'Bogotá',
    });
  });

  it('restablece y emite criterios vacíos al limpiar', () => {
    component.criterios.update((criterios) => ({ ...criterios, edad: 'mayor' }));
    let emitidos = '';
    component.filtrosAplicados.subscribe((filtros) => {
      emitidos = JSON.stringify(filtros);
    });

    component.limpiar();

    expect(JSON.parse(emitidos)).toEqual({
      edad: '',
      ubicacion: '',
    });
  });
});
