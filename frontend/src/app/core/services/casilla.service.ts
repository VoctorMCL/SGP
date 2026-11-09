import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Casilla } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CasillaService {
  private http = inject(HttpClient);

  listarPorOrganizacion(organizacionId: string): Observable<Casilla[]> {
    return this.http.get<{ message: string; casillas: Casilla[] }>(`${environment.apiUrl}/casilla/organizacion/${organizacionId}`).pipe(
      map(res => res.casillas)
    );
  }

  cambiarEstado(casillaId: string, estado: 'libre' | 'ocupado'): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/casilla/${casillaId}/estado`, { estado });
  }

  crearCasilla(datos: Partial<Casilla>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/casilla`, datos);
  }

  editarCasilla(casillaId: string, datos: Partial<Casilla>): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/casilla/${casillaId}`, datos);
  }

  eliminarCasilla(casillaId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/casilla/${casillaId}`);
  }
}
