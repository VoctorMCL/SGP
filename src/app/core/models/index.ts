export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  correo: string;
  placas: string[];
  rol: 'administrador' | 'guardia' | 'usuario';
}

export interface Organizacion {
  _id: string;
  nombre: string;
  nit: string;
  tipoEntidad: 'Residencial' | 'Comercial' | 'Mixto' | 'Publico';
  direccion: string;
  descripcion?: string;
  totalPuestos: number;
  limiteMiembros: number;
  zonaHoraria: string;
  reservasPublicas: boolean;
  cobroAutomatico: boolean;
  cobroPorHora: boolean;
  acceso24_7: boolean;
  codigoInvitacion: string;
  creadoPor: string;
}

export interface Casilla {
  _id: string;
  organizacion: string;
  codigo: string;
  seccion: string;
  tipo: 'standard' | 'discapacitados' | 'electrico' | 'entrada' | 'salida' | 'carril';
  estado: 'libre' | 'ocupado';
  posX?: number;
  posY?: number;
  rotacion?: number;
}

export interface Reserva {
  _id: string;
  casilla: string | any;
  organizacion: string | any;
  usuario: string | any;
  placa: string;
  horaInicio: string | Date;
  duracionHoras: number;
  estado: 'activa' | 'finalizada';
}

export interface AlertaReserva {
  _id: string;
  placa: string;
  horaInicio: string;
  duracionHoras: number;
  casilla: {
    _id: string;
    codigo: string;
    seccion: string;
  };
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    telefono: string;
  };
  horasTranscurridas?: number;
  horasExcedidas?: number;
}
