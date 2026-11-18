
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService, mensajeErrorGoogle } from '../auth.service';

import {
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonCheckbox
} from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonCheckbox
  ]
})
export class RegistroPage {
  nombre = '';
  correo = '';
  contrasena = '';
  confirmacion = '';

  mostrarContrasena = false;
  mostrarConfirmacion = false;
  readonly mensaje = signal('');
  readonly googlePendiente = signal(false);
  aceptaTerminos = false;

  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }


filtrarNombre(event: CustomEvent) {
  const input = event.target as HTMLIonInputElement;
  const valor = String(event.detail.value ?? '');

  const limpio = valor
    .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ '\-]/g, '')
    .slice(0, 60);

  this.nombre = limpio;

  // Sincroniza el valor visible con el valor validado.
  if (limpio !== valor) {
    input.value = limpio;
  }
}


  nombreValido(): boolean {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/
      .test(this.nombre.trim())
      && this.nombre.trim().length >= 2
      && this.nombre.trim().length <= 60;
  }

  correoValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo.trim())
      && this.correo.trim().length <= 254;
  }

  contrasenaValida(): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/
      .test(this.contrasena);
  }

  async registrar(): Promise<void> {
    this.mensaje.set('');

    if (!this.aceptaTerminos) {
      this.mensaje.set('Debes aceptar los términos y condiciones.');
      return;
    }

    if (!this.nombre.trim() || !this.correo.trim() || !this.contrasena || !this.confirmacion) {
      this.mensaje.set('Debes llenar todos los campos.');
      return;
    }

    if (!this.nombreValido()) {
      this.mensaje.set('Escribe un nombre válido.');
      return;
    }

    if (!this.correoValido()) {
      this.mensaje.set('Escribe un correo válido.');
      return;
    }

    if (!this.contrasenaValida()) {
      this.mensaje.set('La contraseña no cumple todos los requisitos.');
      return;
    }

    if (this.contrasena !== this.confirmacion) {
      this.mensaje.set('Las contraseñas no coinciden.');
      return;
    }

    try {
      await this.authService.registrar(
        this.correo.trim(),
        this.contrasena,
        this.nombre.trim()
      );
      await this.router.navigate(['/paginaprincipal']);
    } catch (error) {
      console.error('Error al registrar usuario.', error);
      this.mensaje.set(this.mensajeFirebase(error));
    }
  }

  async registrarConGoogle(): Promise<void> {
    this.mensaje.set('');

    if (!this.aceptaTerminos) {
      this.mensaje.set('Debes aceptar los términos y condiciones.');
      return;
    }

    this.googlePendiente.set(true);
    try {
      await this.authService.iniciarConGoogle();
    } catch (error) {
      this.mensaje.set(mensajeErrorGoogle(error));
    } finally {
      this.googlePendiente.set(false);
    }
  }

  private mensajeFirebase(error: unknown): string {
    const codigo = error instanceof Error && 'code' in error
      ? String((error as Error & { code?: string }).code)
      : '';

    if (codigo.includes('email-already-in-use')) {
      return 'Este correo ya tiene una cuenta. Inicia sesión.';
    }

    if (codigo.includes('weak-password')) {
      return 'La contraseña no cumple los requisitos de seguridad.';
    }

    return 'No se pudo crear la cuenta. Inténtalo nuevamente.';
  }
}
