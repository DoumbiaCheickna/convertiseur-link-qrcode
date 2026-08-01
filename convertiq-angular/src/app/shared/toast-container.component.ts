import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-wrap">
      @for (t of toasts(); track t.id) {
        <div class="toast {{ t.type }}">
          <i
            class="fa-solid"
            [class.fa-circle-check]="t.type === 'success'"
            [class.fa-circle-exclamation]="t.type === 'error'"
            [class.fa-circle-info]="t.type === 'info'"></i>
          <span>{{ t.msg }}</span>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService).toasts;
}
