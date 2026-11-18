
import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { clienteGoogleIos, clienteGoogleWeb } from '../../../environments/google';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithCredential,
  updateProfile,
  UserCredential,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../configuracion/firebase';

export function codigoErrorAuth(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}

export function mensajeErrorGoogle(error: unknown): string {
  const detalle = error instanceof Error ? error.message : String(error);
  if (/28444|developer console|DEVELOPER_ERROR|configuration|serverClientId/i.test(detalle)) {
    return 'Google no reconoce la firma de esta versión de Android. Revisa su registro OAuth en Firebase.';
  }
  if (/No credentials|NoCredentialException/i.test(detalle)) {
    return 'No hay una cuenta de Google disponible. Agrega una cuenta de Google al dispositivo e inténtalo de nuevo.';
  }
  if (/cancel/i.test(detalle) && !codigoErrorAuth(error)) {
    return 'Se canceló el acceso con Google.';
  }
  switch (codigoErrorAuth(error)) {
    case 'auth/unauthorized-domain':
      return 'Firebase no autoriza el acceso con Google desde este dominio.';
    case 'auth/operation-not-allowed':
      return 'El acceso con Google está deshabilitado en Firebase.';
    case 'auth/account-exists-with-different-credential':
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta. Inicia sesión con el método que usaste para crearla.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se canceló el acceso con Google.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes de AdoptPoint y vuelve a intentarlo.';
    case 'auth/google-ios-sin-configurar':
      return 'El acceso con Google requiere configurar el cliente OAuth de esta versión para iOS.';
    case 'auth/network-request-failed':
      return 'No pudimos conectarnos con Google. Revisa tu conexión e inténtalo de nuevo.';
    default:
      return 'No se pudo iniciar sesión con Google. Inténtalo de nuevo o usa tu correo.';
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly persistenceReady = setPersistence(auth, browserLocalPersistence);

  readonly errorGoogleRedireccion = signal('');
  readonly urlGoogleLocal = obtenerUrlGoogleLocal();

  obtenerUsuarioActual(): User | null {
    return auth.currentUser;
  }

  async prepararSesion(): Promise<void> {
    await this.persistenceReady;
  }

  async registrar(email: string, password: string, nombre: string): Promise<UserCredential> {
    await this.persistenceReady;
    const credencial = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credencial.user, { displayName: nombre });
    this.guardarNombreRegistrado(email, nombre);
    await setDoc(doc(db, 'usuarios', credencial.user.uid), { nombre: nombre.trim() }, { merge: true });
    return credencial;
  }

  guardarNombreRegistrado(email: string, nombre: string): void {
    if (!email.trim() || !nombre.trim()) {
      return;
    }

    localStorage.setItem(`adoptpoint:nombre:${email.trim().toLowerCase()}`, nombre.trim());
  }

  obtenerNombreRegistrado(user: User | null): string | null {
    if (!user?.email) {
      return null;
    }

    return localStorage.getItem(`adoptpoint:nombre:${user.email.trim().toLowerCase()}`);
  }

  iniciarSesion(email: string, password: string) {
    return this.persistenceReady.then(() =>
      signInWithEmailAndPassword(auth, email, password)
    );
  }

  async iniciarConGoogle(): Promise<UserCredential | void> {
    this.errorGoogleRedireccion.set('');
    if (Capacitor.isNativePlatform()) {
      return this.iniciarConGoogleNativo();
    }

    if (this.urlGoogleLocal) {
      throw Object.assign(new Error('Usa el dominio local autorizado.'), { code: 'auth/unauthorized-domain' });
    }

    const proveedor = new GoogleAuthProvider();
    proveedor.setCustomParameters({ prompt: 'select_account' });
    try {
      return await signInWithPopup(auth, proveedor);
    } catch (error) {
      if (codigoErrorAuth(error) !== 'auth/popup-blocked' || !permiteRedireccion()) {
        throw error;
      }
      await signInWithRedirect(auth, proveedor);
    }
  }

  async completarGoogleRedireccion(): Promise<void> {
    if (!Capacitor.isNativePlatform() && permiteRedireccion()) {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        this.errorGoogleRedireccion.set(mensajeErrorGoogle(error));
      }
    }
  }

  enviarRecuperacion(correo: string): Promise<void> {
    return sendPasswordResetEmail(auth, correo.trim());
  }

  private async iniciarConGoogleNativo(): Promise<UserCredential> {
    if (Capacitor.getPlatform() === 'ios' && !clienteGoogleIos) {
      throw Object.assign(new Error('Falta el cliente OAuth de iOS.'), { code: 'auth/google-ios-sin-configurar' });
    }
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    await SocialLogin.initialize({
      google: {
        webClientId: clienteGoogleWeb, iOSClientId: clienteGoogleIos, iOSServerClientId: clienteGoogleWeb,
        mode: 'online', skipAuthOnlyAuthorizationAfterSignIn: true
      }
    });
    const { result } = await SocialLogin.login({ provider: 'google', options: { style: 'standard', filterByAuthorizedAccounts: false } });
    if (result.responseType !== 'online' || !result.idToken) {
      throw new Error('Google no devolvió un token de identidad.');
    }
    return signInWithCredential(auth, GoogleAuthProvider.credential(result.idToken));
  }

  cerrarSesion() {
    return signOut(auth);
  }

  observarSesion(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

function permiteRedireccion(): boolean {
  return window.location.protocol === 'https:' && window.location.hostname === auth.config.authDomain;
}

function obtenerUrlGoogleLocal(): string | null {
  if (Capacitor.isNativePlatform() || !['127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    return null;
  }
  const url = new URL(window.location.href);
  url.hostname = 'localhost';
  return url.href;
}