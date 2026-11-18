import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { heart, heartOutline, locationOutline, pawOutline } from 'ionicons/icons';
import { Publicacion, estadoPublicacion, nombrePublicador, tituloPublicacion } from '../../services/publicaciones.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-tarjetas-mascotas',
  templateUrl: './tarjetas-mascotas.component.html',
  styleUrl: './tarjetas-mascotas.component.scss',
  imports: [IonIcon, RouterLink]
})
export class TarjetasMascotasComponent {
  readonly perfil = inject(UsuariosService);
  readonly solicitudes = inject(NotificacionesService);
  private readonly avisos = inject(ToastController);
  readonly publicaciones = input<Publicacion[]>([]);
  readonly abrir = output<Publicacion>();
  readonly tituloPublicacion = tituloPublicacion;
  readonly estadoPublicacion = estadoPublicacion;
  readonly nombrePublicador = nombrePublicador;

  constructor() {
    addIcons({ heart, heartOutline, locationOutline, pawOutline });
  }

  async solicitarAdopcion(publicacion: Publicacion): Promise<void> {
    try {
      if (await this.solicitudes.crearSolicitudAdopcion(publicacion)) {
        const aviso = await this.avisos.create({
          message: 'Solicitud de adopción enviada.', duration: 2600, position: 'middle', cssClass: 'aviso-gps'
        });
        await aviso.present();
      }
    } catch (error) {
      const aviso = await this.avisos.create({
        message: error instanceof Error && !('code' in error) ? error.message : 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
        duration: 3500, position: 'middle', cssClass: 'aviso-gps'
      });
      await aviso.present();
    }
  }

  async alternarFavorito(id: string): Promise<void> {
    try {
      await this.perfil.alternarFavorito(id);
    } catch {
      const aviso = await this.avisos.create({
        message: this.perfil.usuario() ? 'No se pudo actualizar el favorito.' : 'Inicia sesión para guardar mascotas.',
        duration: 2400, position: 'top'
      });
      await aviso.present();
    }
  }
}
