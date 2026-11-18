import { Injectable, inject, signal } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Publicacion, esCelularColombiano, limpiarCelular, numeroWhatsApp, tituloPublicacion } from './publicaciones.service';
import { UsuariosService } from './usuarios.service';

export interface Notificacion {
  id: string;
  mensaje: string;
  creadaEn: string;
  telefonoRemitente?: string;
  nombreMascota?: string;
}

interface Solicitud {
  publicacionId: string;
  remitenteId: string;
  destinatarioId: string;
  nombreRemitente: string;
  nombreMascota: string;
  telefonoRemitente: string;
  creadaEn: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly solicitudes = collection(db, 'solicitudesAdopcion');
  private readonly perfil = inject(UsuariosService);
  private readonly alertas = inject(AlertController);
  readonly pendientes = signal<ReadonlySet<string>>(new Set());

  async crearSolicitudAdopcion(publicacion: Publicacion): Promise<boolean> {
    const usuario = this.perfil.usuario();
    if (!usuario) {
      throw new Error('Inicia sesión para enviar una solicitud.');
    }
    if (this.perfil.cargandoPerfil()) {
      throw new Error('Espera un momento mientras cargamos tus datos.');
    }
    if (publicacion.usuarioId === usuario.uid
      || publicacion.estado === 'adoptada' || publicacion.demostracion || this.pendientes().has(publicacion.id)) {
      return false;
    }
    this.pendientes.update((ids) => new Set(ids).add(publicacion.id));
    try {
      let telefono = numeroWhatsApp(this.perfil.telefono())?.slice(2);
      if (!telefono) {
        telefono = await this.pedirCelular();
        if (!telefono) {
          return false;
        }
        await this.perfil.guardarPerfil({ telefono }, usuario.uid);
      } else if (this.perfil.telefono() !== telefono) {
        await this.perfil.guardarPerfil({ telefono }, usuario.uid);
      }
      if (this.perfil.usuario()?.uid !== usuario.uid) {
        throw new Error('La sesión cambió. Vuelve a intentarlo.');
      }
      const solicitud: Solicitud = {
        publicacionId: publicacion.id, destinatarioId: publicacion.usuarioId, remitenteId: usuario.uid,
        nombreRemitente: this.perfil.nombre().slice(0, 60), nombreMascota: tituloPublicacion(publicacion).slice(0, 100),
        telefonoRemitente: telefono, creadaEn: new Date().toISOString()
      };
      await addDoc(this.solicitudes, solicitud);
      return true;
    } finally {
      this.pendientes.update((ids) => new Set([...ids].filter((id) => id !== publicacion.id)));
    }
  }

  enlaceWhatsApp(notificacion: Notificacion): string | null {
    const numero = numeroWhatsApp(notificacion.telefonoRemitente);
    return numero ? 'https://wa.me/' + numero + '?text=' + encodeURIComponent(
      'Hola, recibí tu solicitud de adopción para ' + (notificacion.nombreMascota || 'mi mascota') + ' en AdoptPoint.'
    ) : null;
  }

  observar(uid: string, tipo: 'recibidas' | 'enviadas',
    actualizar: (notificaciones: Notificacion[]) => void, alFallar: () => void): () => void {
    const recibidas = tipo === 'recibidas';
    const locales = this.leerAnteriores(uid, recibidas);
    if (locales.length > 0) {
      actualizar(locales);
    }
    const consulta = query(this.solicitudes, where(recibidas ? 'destinatarioId' : 'remitenteId', '==', uid));
    return onSnapshot(consulta, { includeMetadataChanges: true }, (resultado) => {
      if (resultado.metadata.fromCache && resultado.empty) {
        return;
      }
      const notificaciones = resultado.docs.map((documento): Notificacion => {
        const solicitud = documento.data() as Solicitud;
        return {
          id: documento.id, creadaEn: solicitud.creadaEn,
          telefonoRemitente: recibidas ? solicitud.telefonoRemitente : undefined,
          nombreMascota: solicitud.nombreMascota,
          mensaje: recibidas
            ? solicitud.nombreRemitente + ' envió una solicitud de adopción para “' + solicitud.nombreMascota + '”'
            : 'Enviaste una solicitud de adopción para “' + solicitud.nombreMascota + '”'
        };
      });
      actualizar([...notificaciones, ...locales].sort((a, b) => b.creadaEn.localeCompare(a.creadaEn)));
    }, alFallar);
  }

  private async pedirCelular(): Promise<string | undefined> {
    let telefono: string | undefined;
    const aviso = await this.alertas.create({
      cssClass: 'aviso-celular', header: 'Tu celular de contacto',
      message: 'Lo guardaremos en tu cuenta para que el publicador pueda responderte por WhatsApp.',
      inputs: [{ name: 'telefono', type: 'tel', placeholder: '3001234567',
        attributes: { inputmode: 'tel', autocomplete: 'tel-national', maxlength: 18 } }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar y solicitar', handler: (datos: { telefono: string }) => {
          const numero = limpiarCelular(datos.telefono).replace(/^57(?=3\d{9}$)/, '');
          if (!esCelularColombiano(numero)) {
            aviso.message = 'Escribe un celular colombiano de 10 dígitos que empiece por 3.';
            return false;
          }
          telefono = numero;
          return true;
        } }
      ]
    });
    await aviso.present();
    await aviso.onDidDismiss();
    return telefono;
  }

  private leerAnteriores(uid: string, recibidas: boolean): Notificacion[] {
    try {
      const datos: unknown = JSON.parse(localStorage.getItem('adoptpoint:notificaciones:' + uid) ?? '[]');
      return Array.isArray(datos) ? datos.filter((item) => item && typeof item.id === 'string'
        && typeof item.mensaje === 'string' && typeof item.creadaEn === 'string'
        && (recibidas ? item.tipo === undefined || item.tipo === 'recibida' : item.tipo === 'enviada')) : [];
    } catch {
      return [];
    }
  }
}
