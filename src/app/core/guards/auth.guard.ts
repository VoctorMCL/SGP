import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.ready;

  if (authService.getToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const roleGuard = (rolesPermitidos: string[]): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.ready;

    const rol = authService.userRole();
    if (rol && rolesPermitidos.includes(rol)) {
      return true;
    }

    return router.createUrlTree(['/organizaciones']);
  };
};
