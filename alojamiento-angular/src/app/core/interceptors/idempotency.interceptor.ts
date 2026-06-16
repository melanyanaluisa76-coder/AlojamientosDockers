import { HttpInterceptorFn } from '@angular/common/http';

const IDEMPOTENT_PATTERNS = ['/pagos', '/booking', '/naomy-analuisa/booking'];

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  const isIdempotentRoute = req.method === 'POST'
    && IDEMPOTENT_PATTERNS.some(p => req.url.includes(p));

  if (isIdempotentRoute) {
    const key = crypto.randomUUID();
    req = req.clone({ setHeaders: { 'X-Idempotency-Key': key } });
  }

  return next(req);
};
