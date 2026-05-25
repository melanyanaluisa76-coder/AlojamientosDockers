import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { idempotencyInterceptor } from './core/interceptors/idempotency.interceptor';
import { responseNormalizerInterceptor } from './core/interceptors/response-normalizer.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, idempotencyInterceptor, responseNormalizerInterceptor]),
    ),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
  ],
};
