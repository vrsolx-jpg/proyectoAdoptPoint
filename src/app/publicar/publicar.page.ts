import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { Camera, MediaResult } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cameraOutline,
  checkmarkOutline,
  closeOutline,
  heartOutline,
  homeOutline,
  locationOutline,
  pawOutline,
  imageOutline
} from 'ionicons/icons';
import { UbicacionService } from '../services/ubicacion.service';
import { UsuariosService } from '../services/usuarios.service';
import { comprimirImagen } from '../services/imagenes';
import {
  CasoPublicacion,
  DatosPublicacion,
  PublicacionesService,
  RangoEdad,
  esCelularColombiano,
  limpiarCelular
} from '../services/publicaciones.service';

type Respuesta = boolean | null;
type Especie = 'Perro' | 'Gato' | 'Ave' | 'Otro' | '';

interface FotoPublicacion {
  id: number;
  datos: string;
}

@Component({
  selector: 'app-publicar',
  templateUrl: './publicar.page.html',
  styleUrls: ['./publicar.page.scss'],
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, RouterLink]
})
export class PublicarPage {
  private readonly router = inject(Router);
  private readonly publicacionesService = inject(PublicacionesService);

  caso: CasoPublicacion | null = null;
  readonly fotos = signal<FotoPublicacion[]>([]);
  readonly mensaje = signal('');
  readonly procesandoFotos = signal(false);
  readonly guardando = signal(false);
  private readonly usuarios = inject(UsuariosService);
  readonly ubicacion = inject(UbicacionService);

  private uidContacto?: string;
  telefonoEditado = false;
  ciudadEditada = false;
  telefono = '';
  nombre = '';
  sinNombre = false;
  raza = '';
  edad: RangoEdad | '' = '';
  tamanio = '';
  descripcion = '';
  esterilizado: Respuesta = null;
  sexo = '';
  vacunado: Respuesta = null;
  desparasitado: Respuesta = null;
  peso: number | null = null;
  color = '';
  ciudad = '';
  compatibleNinos: Respuesta = null;
  compatibleMascotas: Respuesta = null;
  entrenadoCasa: Respuesta = null;
  veterinario = '';
  ultimaVisita = '';
  proximaCita = '';

  especieCasa: Especie = '';
  otraEspecieCasa = '';
  especieEncontrada: Especie = '';
  otraEspecie = '';
  lugarEncontrado = '';
  fechaEncontrado = '';
  edadEncontrado: RangoEdad | '' = '';
  tamanioEncontrado = '';
  descripcionEncontrado = '';

  readonly tamanos = ['Pequeño', 'Mediano', 'Grande'];
  readonly rangosEdad: { valor: RangoEdad; texto: string }[] = [
    { valor: 'cachorro', texto: 'Cachorro · 0-2 años' },
    { valor: 'adulto', texto: 'Adulto · 2-6 años' },
    { valor: 'mayor', texto: 'Mayor · 6+ años' }
  ];
  readonly especies = ['Perro', 'Gato', 'Ave', 'Otro'] as const;
  private siguienteIdFoto = 0;

  constructor() {
    effect(() => {
      const uid = this.usuarios.usuario()?.uid;
      const telefono = this.usuarios.telefono();
      const ciudad = this.usuarios.ciudad() ?? '';
      if (uid !== this.uidContacto) {
        this.uidContacto = uid;
        this.telefono = '';
        this.ciudad = '';
        this.telefonoEditado = false;
        this.ciudadEditada = false;
      }
      if (!this.telefonoEditado) {
        this.telefono = limpiarCelular(telefono).replace(/^57(?=3\d{9}$)/, '');
      }
      if (!this.ciudadEditada) {
        this.ciudad = ciudad;
      }
    });
    addIcons({
      arrowBackOutline,
      cameraOutline,
      checkmarkOutline,
      closeOutline,
      heartOutline,
      homeOutline,
      locationOutline,
      pawOutline,
      imageOutline
    });
  }

  async usarUbicacion(): Promise<void> {
    try {
      const ciudad = await this.ubicacion.usarUbicacionActual();
      this.ciudadEditada = false;
      this.ciudad = ciudad;
    } catch {
      // El mensaje del servicio se presenta junto al campo de ciudad.
    }
  }

  seleccionarCaso(caso: CasoPublicacion): void {
    this.caso = caso;
    this.mensaje.set('');
  }

  async seleccionarFotos(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivos = Array.from(entrada.files ?? []);
    entrada.value = '';
    await this.procesarFotos(async () => archivos);
  }

  async abrirGaleria(entrada: HTMLInputElement): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      entrada.click();
      return;
    }
    await this.procesarFotos(async () => {
      const resultado = await Camera.chooseFromGallery({
        allowMultipleSelection: true, limit: 3 - this.fotos().length, targetWidth: 1440, targetHeight: 1440
      });
      return resultado.results.map((foto) => this.origenFoto(foto));
    });
  }

  async tomarFoto(): Promise<void> {
    await this.procesarFotos(async () => [
      this.origenFoto(await Camera.takePhoto({ targetWidth: 1440, targetHeight: 1440 }))
    ]);
  }

  private origenFoto(foto: MediaResult): string {
    if (foto.webPath) {
      return foto.webPath;
    }
    if (foto.uri) {
      return Capacitor.convertFileSrc(foto.uri);
    }
    throw new Error('La cámara no devolvió una imagen.');
  }

  private async procesarFotos(elegir: () => Promise<(Blob | string)[]>): Promise<void> {
    if (this.procesandoFotos() || this.guardando() || this.fotos().length >= 3) {
      return;
    }

    this.procesandoFotos.set(true);
    this.mensaje.set('');
    try {
      const origenes = await elegir();
      for (const origen of origenes) {
        try {
          if (this.fotos().length >= 3) {
            this.mensaje.set('Puedes agregar hasta 3 fotos.');
            continue;
          }
          const datos = await comprimirImagen(origen);
          this.fotos.update((fotos) => [...fotos, { id: this.siguienteIdFoto++, datos }]);
        } catch {
          this.mensaje.set('No se pudo leer una de las fotos. Prueba con una imagen JPG o PNG.');
        } finally {
          if (typeof origen === 'string' && origen.startsWith('blob:')) {
            URL.revokeObjectURL(origen);
          }
        }
      }
    } catch (error) {
      if (!/cancel/i.test(error instanceof Error ? error.message : String(error))) {
        this.mensaje.set('No se pudo abrir la cámara o la galería. Revisa los permisos e inténtalo de nuevo.');
      }
    } finally {
      this.procesandoFotos.set(false);
    }
  }

  quitarFoto(id: number): void {
    this.fotos.update((fotos) => fotos.filter((foto) => foto.id !== id));
  }

  async publicar(): Promise<void> {
    this.mensaje.set('');
    const caso = this.caso;

    if (!caso || this.procesandoFotos() || this.guardando()) {
      return;
    }

    const telefono = limpiarCelular(this.telefono);
    if (!esCelularColombiano(telefono)) {
      this.mensaje.set('Escribe un celular colombiano de 10 dígitos que empiece por 3.');
      return;
    }

    const datos = caso === 'hogar' ? this.validarAnimalDeCasa() : this.validarAnimalEncontrado();
    if (!datos) {
      return;
    }

    if (!this.usuarios.usuario()) {
      this.mensaje.set('Inicia sesión para guardar una publicación.');
      return;
    }

    this.guardando.set(true);
    try {
      await this.publicacionesService.crearPublicacion(
        caso, { ...datos, telefono }, this.fotos().map((foto) => foto.datos), this.usuarios.nombre()
      );
    } catch {
      this.mensaje.set('No se pudo guardar la publicación. Inténtalo de nuevo.');
      return;
    } finally {
      this.guardando.set(false);
    }

    this.caso = null;
    this.fotos.set([]);
    if (!await this.router.navigate(['/paginaprincipal'])) {
      this.mensaje.set('La publicación se guardó. Usa el botón de volver para regresar al inicio.');
    }
  }

  private validarAnimalDeCasa(): DatosPublicacion | null {
    if (!this.especieCasa || (this.especieCasa === 'Otro' && !this.otraEspecieCasa.trim())
      || (!this.sinNombre && !this.nombre.trim()) || !this.edad || !this.tamanio || !this.sexo
      || !this.descripcion.trim() || !this.ciudad.trim() || this.esterilizado === null) {
      this.mensaje.set('Completa la especie, nombre (o indica que no tiene), edad, tamaño, sexo, descripción, ciudad y esterilización.');
      return null;
    }

    return {
      especie: this.especieCasa === 'Otro' ? this.otraEspecieCasa.trim() : this.especieCasa,
      nombre: this.sinNombre ? '' : this.nombre.trim(),
      sinNombre: this.sinNombre,
      raza: this.raza.trim(),
      edad: this.edad,
      tamanio: this.tamanio,
      descripcion: this.descripcion.trim(),
      esterilizado: this.esterilizado,
      sexo: this.sexo,
      vacunado: this.vacunado,
      desparasitado: this.desparasitado,
      peso: this.peso === null ? null : Math.max(0, Math.min(this.peso, 100)),
      color: this.color.trim(),
      ciudad: this.ciudad.trim(),
      compatibleNinos: this.compatibleNinos,
      compatibleMascotas: this.compatibleMascotas,
      entrenadoCasa: this.entrenadoCasa,
      veterinario: this.veterinario.trim(),
      ultimaVisita: this.ultimaVisita,
      proximaCita: this.proximaCita
    };
  }

  private validarAnimalEncontrado(): DatosPublicacion | null {
    if (!this.especieEncontrada || (this.especieEncontrada === 'Otro' && !this.otraEspecie.trim())
      || !this.edadEncontrado || !this.tamanioEncontrado || !this.lugarEncontrado.trim()
      || !this.fechaEncontrado || !this.descripcionEncontrado.trim() || !this.ciudad.trim()) {
      this.mensaje.set('Completa el tipo, edad aproximada y tamaño del animal, lugar, fecha, ciudad y descripción del hallazgo.');
      return null;
    }

    return {
      especie: this.especieEncontrada === 'Otro' ? this.otraEspecie.trim() : this.especieEncontrada,
      edad: this.edadEncontrado,
      tamanio: this.tamanioEncontrado,
      lugarEncontrado: this.lugarEncontrado.trim(),
      fechaEncontrado: this.fechaEncontrado,
      ciudad: this.ciudad.trim(),
      descripcion: this.descripcionEncontrado.trim()
    };
  }
}
