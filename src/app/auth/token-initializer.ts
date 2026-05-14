import { AuthService } from '@auth/services/auth.service';

export function servicesOnRun(authService: AuthService) {
    return () => authService.load();
}
