import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reserva, AlertaReserva } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private http = inject(HttpClient);

  crearReserva(datos: { casilla: string; placa: string; duracionHoras: number }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/reserva`, datos);
  }

  finalizarReserva(reservaId: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/reserva/${reservaId}/finalizar`, {});
  }

  misReservas(): Observable<Reserva[]> {
    return this.http.get<{ message: string; reservas: Reserva[] }>(`${environment.apiUrl}/reserva/propias`).pipe(
      map(res => res.reservas)
    );
  }

  alertasOrganizacion(organizacionId: string): Observable<AlertaReserva[]> {
    return this.http.get<{ message: string; alertas: AlertaReserva[] }>(`${environment.apiUrl}/reserva/organizacion/${organizacionId}/alertas`).pipe(
      map(res => res.alertas)
    );
  }
}
