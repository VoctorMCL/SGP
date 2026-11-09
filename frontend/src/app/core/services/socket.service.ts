import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Casilla, Reserva } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Conectado a Socket.io en tiempo real');
    });
  }

  unirseOrganizacion(organizacionId: string): void {
    this.socket.emit('unirse:organizacion', organizacionId);
  }

  salirOrganizacion(organizacionId: string): void {
    this.socket.emit('salir:organizacion', organizacionId);
  }

  onCasillaActualizada(): Observable<Casilla> {
    return new Observable(observer => {
      this.socket.on('casilla:actualizada', (casilla: Casilla) => {
        observer.next(casilla);
      });
    });
  }

  onCasillaCreada(): Observable<Casilla> {
    return new Observable(observer => {
      this.socket.on('casilla:creada', (casilla: Casilla) => {
        observer.next(casilla);
      });
    });
  }

  onReservaCreada(): Observable<Reserva> {
    return new Observable(observer => {
      this.socket.on('reserva:creada', (reserva: Reserva) => {
        observer.next(reserva);
      });
    });
  }

  onReservaFinalizada(): Observable<Reserva> {
    return new Observable(observer => {
      this.socket.on('reserva:finalizada', (reserva: Reserva) => {
        observer.next(reserva);
      });
    });
  }
}
