import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
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
  trashOutline
} from 'ionicons/icons';
import { auth } from '../firebase';
import {
  CasoPublicacion,
  DatosPublicacion,
  PublicacionesService,
  RangoEdad
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
  fotos: FotoPublicacion[] = [];
  mensaje = '';
  mensajeEsExito = false;
  guardando = false;

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
  peso = '';
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
  readonly espaciosFotos = [0, 1, 2];
  private siguienteIdFoto = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      checkmarkOutline,
      closeOutline,
      heartOutline,
      homeOutline,
      locationOutline,
      pawOutline,
      trashOutline
    });
  }

  seleccionarCaso(caso: CasoPublicacion): void {
    this.caso = caso;
    this.mensaje = '';
    this.mensajeEsExito = false;
  }

  alternarSinNombre(): void {
    this.sinNombre = !this.sinNombre;
    if (this.sinNombre) {
      this.nombre = '';
    }
  }

  async seleccionarFotos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivos = Array.from(input.files || []);
    input.value = '';
    this.mensaje = '';
    this.mensajeEsExito = false;

    for (const archivo of archivos) {
      if (this.fotos.length >= 3) {
        this.mensaje = 'Puedes agregar hasta 3 fotos.';
        break;
      }

      if (!archivo.type.startsWith('image/')) {
        this.mensaje = 'Solo puedes agregar archivos de imagen.';
        continue;
      }

      if (archivo.size > 8 * 1024 * 1024) {
        this.mensaje = 'Cada foto debe pesar menos de 8 MB.';
        continue;
      }

      try {
        const datos = await this.prepararFoto(archivo);
        this.fotos = [...this.fotos, { id: this.siguienteIdFoto++, datos }];
      } catch (error) {
        console.error('No se pudo cargar una foto para la publicación.', error);
        this.mensaje = 'No se pudo procesar una de las fotos seleccionadas.';
      }
    }
  }

  quitarFoto(id: number): void {
    this.fotos = this.fotos.filter((foto) => foto.id !== id);
  }

  async publicar(): Promise<void> {
    this.mensaje = '';
    this.mensajeEsExito = false;
    const caso = this.caso;

    if (!caso) {
      this.mensaje = 'Selecciona qué tipo de publicación quieres crear.';
      return;
    }

    const datos = caso === 'hogar'
      ? this.validarAnimalDeCasa()
      : this.validarAnimalEncontrado();

    if (!datos) {
      return;
    }

    const usuario = auth.currentUser;
    if (!usuario) {
      this.mensaje = 'Inicia sesión para guardar una publicación.';
      return;
    }

    this.guardando = true;
    try {
      this.publicacionesService.crearPublicacion(
        usuario.uid,
        caso,
        datos,
        this.fotos.map((foto) => foto.datos)
      );
      const navegada = await this.router.navigate(['/paginaprincipal']);
      if (!navegada) {
        this.mensaje = 'La publicación se guardó, pero no se pudo abrir la página principal.';
        this.mensajeEsExito = true;
      }
    } catch (error) {
      console.error('No se pudo crear la publicación.', error);
      this.mensaje = 'No se pudo guardar la publicación. Inténtalo nuevamente.';
    } finally {
      this.guardando = false;
    }
  }

  private validarAnimalDeCasa(): DatosPublicacion | null {
    if (!this.especieCasa || (this.especieCasa === 'Otro' && !this.otraEspecieCasa.trim())
      || (!this.sinNombre && !this.nombre.trim()) || !this.edad || !this.tamanio || !this.sexo
      || !this.descripcion.trim() || !this.ciudad.trim() || this.esterilizado === null) {
      this.mensaje = 'Completa la especie, nombre (o indica que no tiene), edad, tamaño, sexo, descripción, ciudad y esterilización.';
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
      peso: this.peso ? Number(this.peso) : null,
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
      || !this.fechaEncontrado || !this.descripcionEncontrado.trim()) {
      this.mensaje = 'Completa el tipo, edad aproximada y tamaño del animal, lugar, fecha y descripción del hallazgo.';
      return null;
    }

    return {
      especie: this.especieEncontrada === 'Otro' ? this.otraEspecie.trim() : this.especieEncontrada,
      edad: this.edadEncontrado,
      tamanio: this.tamanioEncontrado,
      lugarEncontrado: this.lugarEncontrado.trim(),
      fechaEncontrado: this.fechaEncontrado,
      descripcion: this.descripcionEncontrado.trim()
    };
  }

  private async prepararFoto(archivo: File): Promise<string> {
    const origen = await new Promise<string>((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        if (typeof lector.result === 'string') {
          resolve(lector.result);
        } else {
          reject(new Error('No se pudo leer la foto.'));
        }
      };
      lector.onerror = () => reject(lector.error || new Error('Error al leer la foto.'));
      lector.readAsDataURL(archivo);
    });

    const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
      const elemento = new Image();
      elemento.onload = () => resolve(elemento);
      elemento.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
      elemento.src = origen;
    });

    const escala = Math.min(1, 960 / Math.max(imagen.width, imagen.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));

    const contexto = canvas.getContext('2d');
    if (!contexto) {
      throw new Error('No se pudo preparar la foto.');
    }

    contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  }
}
