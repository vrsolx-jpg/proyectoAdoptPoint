import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ConfirmarEliminacionService {
  private readonly avisos = inject(ToastController);

  async preguntar(): Promise<boolean> {
    const aviso = await this.avisos.create({
      position: 'middle',
      layout: 'baseline',
      cssClass: 'aviso-gps',
      header: '¿Por qué quieres eliminar la publicación?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Ya fue adoptado', role: 'adoptado' }
      ]
    });
    await aviso.present();
    return (await aviso.onDidDismiss()).role === 'adoptado';
  }
}
