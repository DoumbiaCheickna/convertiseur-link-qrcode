import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  msg: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  show(msg: string, type: ToastType = 'info'): void {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, msg, type }]);
    setTimeout(() => this.remove(id), 3200);
  }

  remove(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
