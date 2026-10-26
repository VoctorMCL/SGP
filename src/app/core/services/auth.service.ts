import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private tokenKey = 'sgp_token';
  currentUser = signal<Usuario | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  userRole = computed(() => this.currentUser()?.rol ?? null);

  constructor() {
    this.cargarUsuarioInicial();
  }

  cargarUsuarioInicial(): void {
    const token = this.getToken();
    if (token) {
      this.getPerfil().subscribe({
        next: (res: any) => {
          this.currentUser.set(res.usuario);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  login(credentials: { correo: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${environment.apiUrl}/usuario/login`, credentials).pipe(
      tap(res => {
        if (res.token) {
          this.setToken(res.token);
          this.getPerfil().subscribe(perfilRes => {
            this.currentUser.set(perfilRes.usuario);
          });
        }
      })
    );
  }

  registrar(datos: Partial<Usuario> & { password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/usuario/registrar`, datos);
  }

  getPerfil(): Observable<{ usuario: Usuario }> {
    return this.http.get<{ usuario: Usuario }>(`${environment.apiUrl}/usuario/perfil`);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
