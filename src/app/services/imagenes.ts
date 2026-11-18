export const LIMITE_FOTO_PUBLICACION = 240_000;
export const LIMITE_FOTO_PERFIL = 160_000;

export async function comprimirImagen(
  origen: Blob | string,
  ladoMaximo = 1080,
  limite = LIMITE_FOTO_PUBLICACION
): Promise<string> {
  const url = typeof origen === 'string' ? origen : URL.createObjectURL(origen);
  try {
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode();
    const lienzo = document.createElement('canvas');
    const contexto = lienzo.getContext('2d', { alpha: false });
    if (!contexto) {
      throw new Error('No se pudo preparar la imagen.');
    }

    for (let lado = ladoMaximo; lado >= 160; lado = Math.floor(lado * 0.75)) {
      const escala = Math.min(1, lado / Math.max(imagen.naturalWidth, imagen.naturalHeight));
      lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
      lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
      contexto.fillStyle = '#ffffff';
      contexto.fillRect(0, 0, lienzo.width, lienzo.height);
      contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

      for (const calidad of [0.86, 0.76, 0.66]) {
        const jpeg = lienzo.toDataURL('image/jpeg', calidad);
        if (jpeg.startsWith('data:image/jpeg;base64,') && jpeg.length <= limite) {
          return jpeg;
        }
      }
    }
    throw new Error('La imagen no se pudo reducir al tamaño permitido.');
  } finally {
    if (typeof origen !== 'string') {
      URL.revokeObjectURL(url);
    }
  }
}
