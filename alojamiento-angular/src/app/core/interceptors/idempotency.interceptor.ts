import { HttpInterceptorFn } from '@angular/common/http';

export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'POST' && req.url.includes('/pagos')) {
    const key = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    req = req.clone({ setHeaders: { 'Idempotency-Key': key } });
  }
  return next(req);
};
