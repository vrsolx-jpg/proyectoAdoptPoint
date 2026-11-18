export interface Notificacion {
  id: string;
  mensaje: string;
  creadaEn: string;
  telefonoRemitente?: string;
  nombreMascota?: string;
  leida?: boolean;
  origenLocal?: boolean;
}

export interface Solicitud {
  publicacionId: string;
  remitenteId: string;
  destinatarioId: string;
  nombreRemitente: string;
  nombreMascota: string;
  telefonoRemitente: string;
  creadaEn: string;
  leida?: boolean;
}
