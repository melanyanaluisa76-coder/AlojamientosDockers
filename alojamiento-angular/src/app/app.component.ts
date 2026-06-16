import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RealtimeService } from './core/services/realtime.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private realtime = inject(RealtimeService);

  ngOnInit(): void {
    this.realtime.connect(environment.gatewayUrl);
  }
}
