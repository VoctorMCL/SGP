import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Se lee directo de localStorage para evitar una dependencia circular:
  // AuthService inyecta HttpClient y su constructor dispara la carga del perfil.
  const token = localStorage.getItem('sgp_token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
