import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { UsuariosService } from './usuarios.service';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly perfil = inject(UsuariosService);
  private consulta?: { uid: string; promesa: Promise<string> };
  readonly detectando = signal(false);
  readonly mensaje = signal('');

  constructor() {
    effect(() => {
      const uid = this.perfil.usuario()?.uid;
      if (uid && this.perfil.perfilCargado() && this.perfil.ubicacionPermitida() === true) {
        untracked(() => { void this.usarUbicacionActual().catch(() => undefined); });
      }
    });
  }

  usarUbicacionActual(): Promise<string> {
    const uid = this.perfil.usuario()?.uid;
    if (!uid) {
      return Promise.reject(new Error('Inicia sesión para guardar tu ciudad.'));
    }
    if (this.consulta?.uid === uid) {
      return this.consulta.promesa;
    }
    this.detectando.set(true);
    this.mensaje.set('');
    const promesa = this.obtenerYGuardar(uid).finally(() => {
      if (this.consulta?.promesa === promesa) {
        this.consulta = undefined;
        this.detectando.set(false);
      }
    });
    this.consulta = { uid, promesa };
    return promesa;
  }

  async omitir(): Promise<void> {
    await this.perfil.guardarPerfil({ ubicacionPermitida: false });
    this.mensaje.set('');
  }

  private async obtenerYGuardar(uid: string): Promise<string> {
    try {
      if (this.perfil.ubicacionPermitida() !== true) {
        await this.perfil.guardarPerfil({ ubicacionPermitida: true }, uid);
      }
      const ciudad = await this.detectarCiudad();
      if (this.perfil.usuario()?.uid !== uid) {
        throw new Error('La sesión cambió. Vuelve a usar tu ubicación.');
      }
      await this.perfil.guardarPerfil({ ciudad }, uid);
      return ciudad;
    } catch (error) {
      if (this.perfil.usuario()?.uid === uid) {
        this.mensaje.set(this.explicarError(error));
      }
      throw error;
    }
  }

  async detectarCiudad(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      let permiso = await Geolocation.checkPermissions();
      if (permiso.coarseLocation !== 'granted' && permiso.location !== 'granted') {
        permiso = await Geolocation.requestPermissions({ permissions: ['coarseLocation'] });
      }
      if (permiso.coarseLocation !== 'granted' && permiso.location !== 'granted') {
        throw Object.assign(new Error('Permiso de ubicación denegado.'), { code: 'OS-PLUG-GLOC-0003' });
      }
    }

    const { coords } = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, enableLocationFallback: true, timeout: 30_000, maximumAge: 60_000
    });
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.search = new URLSearchParams({
      latitude: coords.latitude.toFixed(3), longitude: coords.longitude.toFixed(3), localityLanguage: 'es'
    }).toString();
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!respuesta.ok) {
      throw new Error('No pudimos consultar la ciudad. Revisa tu conexión y vuelve a usar tu ubicación.');
    }
    const resultado: { countryCode?: string; city?: string; locality?: string } = await respuesta.json();
    const ciudad = resultado.city?.trim() || resultado.locality?.trim();
    if (resultado.countryCode !== 'CO' || !ciudad) {
      throw new Error('No encontramos una ciudad de Colombia para esta ubicación.');
    }
    return ciudad.slice(0, 80);
  }

  private explicarError(error: unknown): string {
    const codigo = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    if (['OS-PLUG-GLOC-0003', '1'].includes(codigo)) {
      return 'Permite la ubicación de AdoptPoint en los ajustes del dispositivo y vuelve a pulsar Usar mi ubicación.';
    }
    if (['OS-PLUG-GLOC-0007', 'OS-PLUG-GLOC-0009'].includes(codigo)) {
      return 'Activa la ubicación del dispositivo y vuelve a pulsar Usar mi ubicación.';
    }
    if (['OS-PLUG-GLOC-0010', 'OS-PLUG-GLOC-0002', '2', '3'].includes(codigo)) {
      return 'El dispositivo aún no obtuvo tu ubicación. Acércate a una ventana y vuelve a intentarlo.';
    }
    if (codigo === 'permission-denied') {
      return 'No pudimos guardar tu preferencia de ubicación. Revisa la sincronización de Firestore.';
    }
    if (error instanceof Error && error.name !== 'TypeError' && error.name !== 'TimeoutError') {
      return error.message;
    }
    return 'No pudimos consultar tu ciudad. Revisa tu conexión y vuelve a usar tu ubicación.';
  }
}
