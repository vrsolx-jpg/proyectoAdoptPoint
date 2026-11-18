import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetasMascotasComponent } from './tarjetas-mascotas.component';

describe('TarjetasMascotasComponent', () => {
  let component: TarjetasMascotasComponent;
  let fixture: ComponentFixture<TarjetasMascotasComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TarjetasMascotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
