import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Organizacion, Usuario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrganizacionService {
  private http = inject(HttpClient);

  misOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<{ message: string; organizaciones: Organizacion[] }>(`${environment.apiUrl}/organizacion`).pipe(
      map(res => res.organizaciones)
    );
  }

  crearOrganizacion(datos: Partial<Organizacion>): Observable<{ message: string; organizacion: Organizacion }> {
    return this.http.post<{ message: string; organizacion: Organizacion }>(`${environment.apiUrl}/organizacion`, datos);
  }

  unirse(codigoInvitacion: string): Observable<{ message: string; organizacion: Organizacion }> {
    return this.http.post<{ message: string; organizacion: Organizacion }>(`${environment.apiUrl}/organizacion/unirse`, {
      codigoInvitacion
    });
  }

  listarMiembros(organizacionId: string): Observable<Usuario[]> {
    return this.http.get<{ message: string; miembros: Usuario[] }>(`${environment.apiUrl}/organizacion/${organizacionId}/miembros`).pipe(
      map(res => res.miembros)
    );
  }

  editarOrganizacion(id: string, cambios: Partial<Organizacion>): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/organizacion/${id}`, cambios);
  }
}
