import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Los microservicios devuelven respuestas sin el envelope { data, success }.
 * Este interceptor normaliza arrays y objetos planos al formato ApiResponse<T>
 * que espera el resto de la aplicación.
 */
export const responseNormalizerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (!(event instanceof HttpResponse)) return event;

      const body = event.body;
      if (body === null || body === undefined) return event;

      // Ya tiene el envelope correcto
      if (typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
        return event;
      }

      // Array plano o objeto sin envelope → envolver
      return event.clone({ body: { data: body, success: true } });
    }),
  );
};
