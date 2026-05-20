import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col items-center justify-center py-20 gap-4">
      <mat-progress-spinner mode="indeterminate" [diameter]="diameter" color="primary" />
      @if (message) {
        <p class="text-sm text-muted">{{ message }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  @Input() message = '';
  @Input() diameter = 48;
}
