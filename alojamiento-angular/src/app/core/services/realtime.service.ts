import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { NotificationService } from './notification.service';

export interface ReservaCreadaPayload {
  reservaId: number;
  codigoReserva: string;
  clienteId: number;
  alojamientoId: number;
  fechaCheckIn: string;
  fechaCheckOut: string;
  total: number;
  fechaCreacion: string;
}

export interface FacturaPagadaPayload {
  reservaId: number;
  facturaId: number;
  montoPagado: number;
  fechaPago: string;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;

  readonly reservaCreada$ = new Subject<ReservaCreadaPayload>();
  readonly facturaPagada$ = new Subject<FacturaPagadaPayload>();

  constructor(private notifications: NotificationService) {}

  connect(gatewayUrl: string): void {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${gatewayUrl}/hub/notifications`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('OnReservaCreadaEvent', (payload: ReservaCreadaPayload) => {
      this.reservaCreada$.next(payload);
      this.notifications.info(
        `Nueva reserva ${payload.codigoReserva} por $${payload.total.toFixed(2)}`
      );
    });

    this.connection.on('OnFacturaPagadaEvent', (payload: FacturaPagadaPayload) => {
      this.facturaPagada$.next(payload);
      this.notifications.success(
        `Reserva #${payload.reservaId} confirmada — Factura #${payload.facturaId} pagada`
      );
    });

    this.connection
      .start()
      .catch(err => console.error('SignalR connection error:', err));
  }

  disconnect(): void {
    this.connection?.stop();
    this.connection = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
